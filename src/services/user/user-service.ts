import { session } from 'electron';
import { BehaviorSubject, Subject } from 'rxjs';

import { AppOnboardingLaunchSource } from '../../app/dialog-window/welcome-dialog/constants';
import { get, HttpResponseCode } from '../../http';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { subscribeSentryToUserService } from '../../sentry/main';
import { API_CURRENT_USER, TVAnonymous, TVUser } from '../../tv-api';
import { resolveWebsiteRoot } from '../../tv-api/url-helpers';
import { ignorePromise, sleep } from '../../utils';
import { safeJsonParse } from '../../utils/json-parse';
import { appEventService } from '../app-event-service';
import { getConfiguration } from '../configuration';
import { windowService } from '../window';
import { AuthenticationHandler, SignInSource } from './authentication-handler';
import * as Claims from './claims';
import { AUTH_HANDLER_CONTRACT, AuthenticationStage } from './iauthentication-handler';
import { IUserService, PrepareSignInOutData, SignInData, USER_SERVICE_CONTRACT } from './iuser-service';
import { User } from './user';

async function prepareUserSignInOut(channel: Subject<PrepareSignInOutData>, user: User): Promise<void> {
	const works: Array<Promise<void>> = [];

	channel.next({
		user,
		workAcceptor: (work) => works.push(work),
	});

	if (works.length > 0) {
		await Promise.all(works);
	}
}

@ExposeSingletonService(USER_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('UserService')
export class UserService implements IUserService {
	private watchState = true;
	private session: Electron.Session | undefined;
	private lastAuthError = '';
	private lastAuthErrorTime: number | undefined;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	private readonly authErrorsFilterTimeout = 1 * 60 * 1000;
	private readonly userInfoRequestTimeout: number;

	private currentUser = new User(Claims.makeUserClaims({ id: undefined }));

	private readonly userChangeEvent = new BehaviorSubject<Claims.ClaimsContainer>(this.currentUser.claims);
	readonly userChange = this.userChangeEvent.asObservable();

	private readonly userSignedInSubject = new Subject<SignInData>();
	readonly userSignedIn = this.userSignedInSubject.asObservable();

	private readonly userSignedOutSubject = new Subject<void>();
	readonly userSignedOut = this.userSignedOutSubject.asObservable();

	private readonly prepareSignInSubject = new Subject<PrepareSignInOutData>();
	readonly prepareUserSignIn = this.prepareSignInSubject.asObservable();

	private readonly prepareSignOutSubject = new Subject<PrepareSignInOutData>();
	readonly prepareUserSignOut = this.prepareSignOutSubject.asObservable();

	private readonly excludedCookies = ['theme', 'cookiesSettings'];
	private authenticationProcessed = false;

	private authHandler: AuthenticationHandler;

	constructor() {
		loggerService().debug('Initializing UserService');
		this.currentUser.claims.push({ type: Claims.CLAIM_FIRSTTIME_INITIALIZATION, value: true });

		this.userInfoRequestTimeout = getConfiguration().advanced.infoRequestTimeout;

		appEventService().startup.subscribe(() => {
			loggerService().debug('UserService.Startup()');
			this.session = session.defaultSession;
			ignorePromise(this.watchUserState());
		});

		appEventService().shutdown.subscribe(() => {
			this.watchState = false;
		});

		this.authHandler = new AuthenticationHandler(() => this.updateCurrentUser());
		IpcServices.getProvider().registerFactory(AUTH_HANDLER_CONTRACT, () => this.authHandler);
		subscribeSentryToUserService(this);
	}

	private async watchUserState(): Promise<void> {
		const delay = 100;

		while (this.watchState) {
			await this.updateCurrentUser();
			await sleep(delay);
		}
	}

	getCurrentUser(): User {
		return this.currentUser;
	}

	getCurrentUserAsync(): Promise<User> {
		return Promise.resolve(this.currentUser);
	}

	private async updateCurrentUser(): Promise<void> {
		let user: TVUser | TVAnonymous = { id: undefined };
		let sessionCookie: Electron.Cookie | undefined;

		if (this.session) {
			try {
				const cookie = await this.session.cookies.get({ name: getConfiguration().urls.cookieName });
				if (cookie.length === 0) {
					ignorePromise(this.updateAuthentication(user));
					return;
				}

				sessionCookie = cookie[0];

				// same cookie means same user, no need to check API
				if (sessionCookie.value === this.currentUser.session?.value) {
					return;
				}

				const response = await get({
					url: resolveWebsiteRoot(`${ API_CURRENT_USER }?avatars_fallback=true`),
					session: this.session,
					timeout: this.userInfoRequestTimeout,
				});

				if (response.code === HttpResponseCode.Forbidden && this.authHandler.getAuthStage() === AuthenticationStage.Waiting2FA) {
					this.lastAuthError = response.errorMessage ?? 'Unknown error';
				}

				if (response.code !== HttpResponseCode.OK) {
					throw new Error(response.errorMessage ?? 'Unknown error');
				}

				const isTVUserOrTVAnonymous = (value: any): value is (TVUser | TVAnonymous) => {
					return typeof value === 'object' && 'id' in value;
				};

				const parsedData = safeJsonParse(isTVUserOrTVAnonymous)(response?.data?.toString() ?? '');
				if (!parsedData) {
					throw new Error('JSON.parse error');
				}
				user = parsedData;
			}
			catch (err) {
				const errorMessage = (err as Error).message;

				// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
				// eslint-disable-next-line no-mixed-operators
				if (this.lastAuthErrorTime && this.lastAuthErrorTime + this.authErrorsFilterTimeout < Date.now() ||
					this.lastAuthError !== errorMessage) {
					loggerService().error('[UserService.updateCurrentUser()] Could not get user information', err);
				}

				ignorePromise(this.updateAuthentication(user));

				this.lastAuthErrorTime = Date.now();
				this.lastAuthError = errorMessage;

				return;
			}
		}

		ignorePromise(
			this.updateAuthentication(user, sessionCookie));
	}

	@logCall
	async doSignIn(initiator: SignInSource): Promise<void> {
		if (this.currentUser.isAuthenticated) {
			loggerService().warn('Requesting sign in when authentication is active');
			return;
		}

		await this.authHandler.signIn(initiator);
	}

	@logCall
	showAppOnboardingDialog(source: AppOnboardingLaunchSource, tabId?: string): void {
		ignorePromise(this.authHandler.showWelcomeDialog(source || AppOnboardingLaunchSource.AppFirstLaunch, tabId));
	}

	@logCall
	async requestProFeature(): Promise<void> {
		const wnd = windowService().getLastFocusedWindow();

		if (!wnd || !wnd.activeTab) {
			return;
		}

		try {
			await wnd.activeTab.executeJavaScript(`
				if (window.TradingView !== undefined){
					window.TradingView.createGoProDialog({feature: 'manyDesktopWindows'});
				}
			`);
		}
		catch (err) {
			loggerService().error('[UserService.requestProFeature()] Failed to trigger platform popup', err);
		}
	}

	private async updateAuthentication(tvUser: TVUser | TVAnonymous, sessionCookie?: Electron.Cookie): Promise<void> {
		if (this.authenticationProcessed) {
			return; // sign-out can be initiated from many sources/tabs/views at the same time
		}

		try {
			this.authenticationProcessed = true;
			const newUser = new User(Claims.makeUserClaims(tvUser), sessionCookie);

			if (this.currentUser.isAuthenticated &&
				newUser.isAuthenticated &&
				this.currentUser.id === newUser.id) {
				return; // same user
			}

			if (!this.currentUser.isAuthenticated && !newUser.isAuthenticated) {
				if (this.currentUser.hasClaim(Claims.CLAIM_FIRSTTIME_INITIALIZATION, true)) {
					this.notifyUserSignedOut();
					this.userChangeEvent.next(this.currentUser.claims);
					this.currentUser = newUser; // cleanup firsttime-initialization claims.
				}

				return;
			}

			if (this.currentUser.isAuthenticated) {
				loggerService().info(`Will sign out user: '${ this.currentUser.username }', id: '${ this.currentUser.id }'`);
				await prepareUserSignInOut(this.prepareSignOutSubject, this.currentUser);
				this.notifyUserSignedOut();
				this.authHandler.resetState();
			}

			this.currentUser = newUser;
			if (this.currentUser.isAuthenticated) {
				loggerService().info(`Will sign in user: '${ newUser.username }', id: '${ newUser.id }'`);
				await prepareUserSignInOut(this.prepareSignInSubject, this.currentUser);
				const data: SignInData = { user: this.currentUser };
				this.notifyUserSignedIn(data);
			}

			this.userChangeEvent.next(this.currentUser.claims);
		}
		finally {
			this.authenticationProcessed = false;
		}
	}

	@logCall
	private notifyUserSignedIn(data: SignInData): void {
		this.userSignedInSubject.next(data);
	}

	@logCall
	private notifyUserSignedOut(): void {
		this.userSignedOutSubject.next();
	}
}
