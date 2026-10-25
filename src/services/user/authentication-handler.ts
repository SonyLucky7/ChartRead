import { createHash } from 'crypto';
import { clipboard, session, shell } from 'electron';
import { Rectangle } from 'electron/main';
import i18next from 'i18next';
import { BehaviorSubject } from 'rxjs';
import { URL } from 'url';

import { APP_ONBOARDING_LOCAL_STORAGE_LAUNCH_SOURCE_FIELD, AppOnboardingLaunchSource } from '../../app/dialog-window/welcome-dialog/constants';
import { HttpResponse, HttpResponseCode, post } from '../../http';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { openExternalIgnoringAppLinking } from '../../native';
import {
	API_TVD_2FA,
	API_TVD_AUTH,
	API_TVD_AUTH_COMPLETE,
	APP_PROTOCOL,
	AUTH_METHOD,
	getApiCSRFHeaders,
} from '../../tv-api';
import { resolveAuthenticationRoot, resolveWebsiteRoot } from '../../tv-api/url-helpers';
import { generateRandomASCIIKey } from '../../tvd-runtime/core/utils/random';
import { isAccountRecoveryUrl, isDarwin, isWin32 } from '../../utils';
import { ignorePromise } from '../../utils/async';
import { jsonParse } from '../../utils/json-parse';
import { getConfiguration } from '../configuration';
import { localeService } from '../locale';
import { settingsProvider } from '../settings';
import { windowService } from '../window';
import { DialogWindow } from '../window/dialog-window';
import { TabbedWindow } from '../window/tabbed-window-imports';
import { WelcomeDialog, WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH } from '../window/window-api';
import { AuthenticationResponse, AuthenticationStage, AuthenticationState, IAuthenticationHandler, WAIT_REDIRECT_TIMEOUT_EXPIRED } from './iauthentication-handler';
import { userService } from './index';

interface SessionState {
	keySource: string;
	keyHash: string;
	error?: string;
	token?: string;
	secondFactorData?: AuthenticationResponse;
}

export type SignInSource = 'first_sign' | 'platform' | 'header' | 'main_menu' | 'new_product_tab';

const TWO_FA_PLATFORM_PRELOAD = 'preload/two-fa-preload.js';
const WELCOME_MODAL_WIDTH = 700;
const WELCOME_MODAL_HEIGHT = 550;

@logCallName('AuthenticationHandler')
export class AuthenticationHandler implements IAuthenticationHandler {
	static isAppOnboardingWindowLoading = false;

	private readonly tokenLength = 32;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	private readonly tokenWaitTimeout: number;

	private state: SessionState | undefined;

	private welcomeDialogWindow: DialogWindow | undefined;
	private browserRedirectWaitTimeout: ReturnType<typeof setTimeout> | undefined;

	private authStateSubject = new BehaviorSubject<AuthenticationState>({ stage: AuthenticationStage.NoAuthentication });
	authenticationState = this.authStateSubject.asObservable();

	private isSignedIn = false;

	constructor(private checkSession: () => Promise<void>) {
		loggerService().debug('Initializing AuthenticationHandler');

		this.tokenWaitTimeout = getConfiguration().authentication.waitRedirectTimeout;
	}

	getAuthStage(): AuthenticationStage {
		return this.authStateSubject.value.stage;
	}

	async signIn(initiator: SignInSource): Promise<void> {
		this.resetState();
		await this.showWelcomeDialog(initiator);
	}

	@logCall
	async signInWithBrowser(): Promise<void> {
		const url = this.createAuthenticationUrl();

		this.authStateSubject.next({ stage: AuthenticationStage.WaitingToken });

		this.setWatchers();

		try {
			await (isWin32() ? openExternalIgnoringAppLinking(url) : shell.openExternal(url));
		}
		catch (err) {
			loggerService().error('Error on openExternal', err);

			this.authStateSubject.next({ stage: AuthenticationStage.Error, error: i18next.t('App wasn\'t able to open your browser. Make sure the default browser is set in your system.') });
		}

		this.browserRedirectWaitTimeout = setTimeout(() => {
			if (
				this.authStateSubject.value.stage === AuthenticationStage.WaitingToken &&
				!this.state?.token
			) {
				this.authStateSubject.next({ stage: AuthenticationStage.NoAuthentication, error: WAIT_REDIRECT_TIMEOUT_EXPIRED });

				loggerService().warn(WAIT_REDIRECT_TIMEOUT_EXPIRED);
			}
		}, this.tokenWaitTimeout);
	}

	@logCall
	acceptRedirectUrl(url: string): void {
		if (!this.state) {
			loggerService().error('Requested accept with no current authentication state');
			return;
		}

		const token = this.getTokenFromRedirectUrl(url);

		if (!token) {
			return;
		}

		this.state.token = token;
		this.authStateSubject.next({ stage: AuthenticationStage.TokenReady });
	}

	@logCall
	cancelSignIn(): void {
		this.resetState();
	}

	@logCall
	private setWatchers(): void {
		this.waitBrowserToken();
		this.wait2FA();
	}

	@logCall
	private waitBrowserToken(): void {
		const selfSub = this.authStateSubject.subscribe((state) => {
			if (state.stage === AuthenticationStage.TokenReady || this.isAuthenticationCompleted(state.stage)) {
				selfSub.unsubscribe();

				void this.completeAuthentication();
			}
		});
	}

	@logCall
	private wait2FA(): void {
		const selfSub = this.authStateSubject.subscribe((state) => {
			if (state.stage === AuthenticationStage.Waiting2FA || this.isAuthenticationCompleted(state.stage)) {
				selfSub.unsubscribe();

				if (this.state?.secondFactorData) {
					void this.accept2FA(this.state.secondFactorData);
				}
			}
		});
	}

	@logCall
	private async completeAuthentication(): Promise<void> {
		if (!this.state?.token) {
			loggerService().warn('Requested authentication complete with no token');
			return;
		}

		const completeUrl = resolveAuthenticationRoot(`${ API_TVD_AUTH_COMPLETE }?token=${ this.state.token }&key_source=${ encodeURIComponent(this.state.keySource) }`);

		let authResponse: HttpResponse | undefined;

		try {
			authResponse = await post({
				url: completeUrl,
				requestData: { headers: getApiCSRFHeaders() },
				session: session.defaultSession,
			});

			if (authResponse.code !== HttpResponseCode.OK && authResponse.code !== HttpResponseCode.Conflict) {
				throw new Error('Unknown error on requesting auth complete');
			}
		}
		catch (err) {
			loggerService().error('Error on authentication complete', err);

			this.authStateSubject.next(
				{ stage: AuthenticationStage.Error, error: (err as Error).message });

			return;
		}

		if (!authResponse?.data) {
			const noDataError = 'Empty authentication complete response';
			loggerService().error(noDataError);

			this.authStateSubject.next(
				{ stage: AuthenticationStage.Error, error: noDataError });

			return;
		}

		const authResponseData = this.getAuthResponseData(authResponse.data.toString());

		if (!authResponseData || !this.shouldEnter2FA(authResponseData)) {
			this.successSignedIn();
			return;
		}

		try {
			this.state.secondFactorData = authResponseData;
			this.authStateSubject.next({ stage: AuthenticationStage.Waiting2FA });
		}
		catch (error) {
			loggerService().error('[AuthenticationHandler.completeAuthentication()]:', error);
		}
	}

	@logCall
	private shouldEnter2FA(authResponse: AuthenticationResponse): boolean {
		const twoFARequiredError = '2FA_required';
		const twoFAGeneratedError = '2FA_challenge_not_generated';

		if (
			authResponse.error === twoFARequiredError ||
			authResponse.code === twoFARequiredError ||
			authResponse.code === twoFAGeneratedError
		) {
			return true;
		}

		return false;
	}

	@logCall
	async accept2FA(twoFAResponse: AuthenticationResponse): Promise<void> {
		if (!this.welcomeDialogWindow || this.welcomeDialogWindow.windowRef.isDestroyed()) {
			loggerService().error('Requested 2FA but sign in window not found');
			this.resetState();

			return;
		}

		const setErrorState = (error: string): void => {
			loggerService().error(error);
			this.authStateSubject.next({ stage: AuthenticationStage.Error, error });
		};

		if (!twoFAResponse.two_factor_types) {
			setErrorState('2FA types missing');

			return;
		}

		if (twoFAResponse.two_factor_types.length !== 1) {
			setErrorState(`Expected single 2FA type, got ${ JSON.stringify(twoFAResponse.two_factor_types) }`);

			return;
		}

		const type = twoFAResponse.two_factor_types[0].name;

		if (!type) {
			setErrorState('2FA type name not found');
			return;
		}

		const url = `${ resolveWebsiteRoot(API_TVD_2FA) }${ type }/`;

		const welcomeDialogWindowBounds = this.welcomeDialogWindow.windowRef.getBounds();
		const window2FAx = Math.ceil((welcomeDialogWindowBounds.width - WELCOME_MODAL_WIDTH) / 2);
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const window2FAy = Math.ceil((welcomeDialogWindowBounds.height - 290) / 2);

		const viewBounds: Rectangle = {
			x: window2FAx,
			y: window2FAy,
			width: WELCOME_MODAL_WIDTH,
			height: 305,
		};

		const view = await this.welcomeDialogWindow.addCustomView(url, viewBounds, TWO_FA_PLATFORM_PRELOAD);

		view.webContents.focus();

		view.webContents.on('will-navigate', (ev, navUrl) => {
			if (isAccountRecoveryUrl(navUrl)) {
				void shell.openExternal(navUrl);
			}

			ev.preventDefault();
		});

		const signInSubscription = userService().userSignedIn.subscribe(() => {
			signInSubscription.unsubscribe();
			this.successSignedIn();
		});
	}

	@logCall
	resetState(): void {
		this.isSignedIn = false;
		if (this.welcomeDialogWindow) {
			this.welcomeDialogWindow.removeCustomView();
		}

		this.state = undefined;
		this.authStateSubject.next({ stage: AuthenticationStage.NoAuthentication });

		this.clearBrowserRedirectTimeout();
	}

	@logCall
	private getAuthResponseData(response: string): AuthenticationResponse | null {
		return jsonParse<AuthenticationResponse>(response);
	}

	@logCall
	private getTokenFromRedirectUrl(url: string): string | null {
		try {
			const urlObject = new URL(url);
			return urlObject.searchParams.get('token');
		}
		catch (err) {
			loggerService().error(`[AuthenticationHandler.getTokenFromRedirectUrl()] Invalid redirect url ${ url }`);
		}

		return null;
	}

	private createWelcomeDialogWindow(parentWnd: TabbedWindow, closable = false): Promise<DialogWindow> {
		if (parentWnd.windowRef.isFullScreen()) {
			parentWnd.toggleFullscreen();
		}

		if (parentWnd.windowRef.isMaximized()) {
			parentWnd.toggleMaximize();
		}

		const { width: parentWidth, height: parentHeight } = parentWnd.windowRef.getBounds();

		if (parentWidth < WINDOW_DEFAULT_WIDTH || parentHeight < WINDOW_DEFAULT_HEIGHT) {
			parentWnd.windowRef.setBounds({
				width: WINDOW_DEFAULT_WIDTH,
				height: WINDOW_DEFAULT_HEIGHT,
			}, false);
		}

		return DialogWindow.createDialogWindow({
			data: new WelcomeDialog(closable),
			size: isDarwin() ? { width: WELCOME_MODAL_WIDTH, height: WELCOME_MODAL_HEIGHT } : parentWnd.windowRef.getBounds(),
			parentWindow: parentWnd.windowRef,
			isModal: isDarwin(),
			closeOnSubmit: true,
			isTransparent: true,
			closeOnBlur: closable,
		});
	}

	@logCall
	async showWelcomeDialog(initiator: SignInSource | AppOnboardingLaunchSource, tabId?: string): Promise<void> {
		AuthenticationHandler.isAppOnboardingWindowLoading = true;

		if (this.welcomeDialogWindow) {
			AuthenticationHandler.isAppOnboardingWindowLoading = false;
			return;
		}

		const parentWnd = tabId
			? windowService().findWindow({ tabId })
			: windowService().getLastFocusedWindow();

		if (!parentWnd) {
			AuthenticationHandler.isAppOnboardingWindowLoading = false;
			return;
		}

		this.welcomeDialogWindow = await this.createWelcomeDialogWindow(parentWnd, initiator === AppOnboardingLaunchSource.LaunchedByUser);

		if (this.welcomeDialogWindow.windowRef.isDestroyed()) {
			return;
		}

		const isSignInWindow = initiator !== AppOnboardingLaunchSource.AppFirstLaunch && initiator !== AppOnboardingLaunchSource.LaunchedByUser;

		if (isSignInWindow) {
			const message = `localStorage.removeItem('${ APP_ONBOARDING_LOCAL_STORAGE_LAUNCH_SOURCE_FIELD }')`;
			ignorePromise(this.welcomeDialogWindow.windowRef.webContents.executeJavaScript(message));

			this.welcomeDialogWindow.windowRef.on('closed', () => {
				if (!this.isSignedIn) {
					loggerService().info('User cancelled Sign in');
					this.authStateSubject.next({ stage: AuthenticationStage.NoAuthentication });
				}

				if (parentWnd.disposed()) {
					AuthenticationHandler.isAppOnboardingWindowLoading = false;
					return;
				}

				parentWnd.windowRef.focus();
			});

			this.welcomeDialogWindow.windowRef.on('focus', () => this.tryObtainTokenFromClipboard());
		}

		else {
			const message = `localStorage.setItem('${ APP_ONBOARDING_LOCAL_STORAGE_LAUNCH_SOURCE_FIELD }', '${ initiator }')`;
			ignorePromise(this.welcomeDialogWindow.windowRef.webContents.executeJavaScript(message));

			this.welcomeDialogWindow.windowRef.on('close', () => {
				parentWnd.windowRef.focus();
			});
		}

		settingsProvider().isSeeOnboardingBeforeSubject.next(true);
		this.welcomeDialogWindow.show();
		this.welcomeDialogWindow.windowRef.moveTop();

		AuthenticationHandler.isAppOnboardingWindowLoading = false;

		// waiting for the dialog to close
		await this.welcomeDialogWindow.waitInput();

		this.disposeWelcomeDialog();
	}

	@logCall
	private tryObtainTokenFromClipboard(): void {
		if (this.authStateSubject.value.stage !== AuthenticationStage.WaitingToken) {
			return;
		}
		const text = clipboard.readText();

		if (!text) {
			return;
		}

		this.acceptRedirectUrl(text);
	}

	@logCall
	private disposeWelcomeDialog(): void {
		if (this.welcomeDialogWindow && !this.welcomeDialogWindow.windowRef.isDestroyed()) {
			this.welcomeDialogWindow.removeCustomView();
			this.welcomeDialogWindow.closeDialogWindow();
			this.welcomeDialogWindow.windowRef.removeAllListeners();

			this.welcomeDialogWindow = undefined;
		}
	}

	@logCall
	private isAuthenticationCompleted(stage: AuthenticationStage): boolean {
		return stage === AuthenticationStage.NoAuthentication || stage === AuthenticationStage.Authenticated;
	}

	@logCall
	private createAuthenticationUrl(): string {
		const token = generateRandomASCIIKey(this.tokenLength);
		const hash = createHash('sha256');

		const tokenHash = hash.update(token).digest('hex');

		this.state = {
			keySource: token,
			keyHash: tokenHash,
		};

		const locale = localeService().currentLocale();

		const redirectUrl = `${ APP_PROTOCOL }://${ AUTH_METHOD }/`;
		return resolveAuthenticationRoot(`${ API_TVD_AUTH }?locale=${ locale }&key=${ encodeURIComponent(tokenHash) }&redirect_url=${ encodeURIComponent(redirectUrl) }`);
	}

	private clearBrowserRedirectTimeout(): void {
		if (this.browserRedirectWaitTimeout) {
			clearTimeout(this.browserRedirectWaitTimeout);
			this.browserRedirectWaitTimeout = undefined;
		}
	}

	private successSignedIn(): void {
		this.isSignedIn = true;
		this.authStateSubject.next({ stage: AuthenticationStage.Authenticated });
		this.disposeWelcomeDialog();
	}
}
