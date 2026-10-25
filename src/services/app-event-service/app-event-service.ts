import { app, BrowserWindow, RelaunchOptions, session } from 'electron';
import path from 'path';
import { ReplaySubject, Subject } from 'rxjs';
import { skip } from 'rxjs/operators';

import { assert } from '../../assertion';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { networkService } from '../../main/network';
import { PROXY_SERVICE_ACCOUNT_NAME, PROXY_SERVICE_NAME, PROXY_SERVICE_PASSWORD_NAME } from '../../main/network/proxy-credentials';
import { sessionStorageService } from '../../main/session-storage';
import { registerApplicationRestart as registerApplicationRestartAfterUpdateWin32 } from '../../native';
import { notificationService } from '../../notification';
import { persistenceService } from '../../persistence';
import { APP_PROTOCOL } from '../../tv-api';
import { getMessageOfError } from '../../tvd-runtime/core';
import { ignorePromise, isDarwin, isLinux, isLocalURI, isTradingviewProtocol, isValidUrl, isWin32, sleep, TARGET_TVD_HOST } from '../../utils';
import { PermissionsHandler } from '../../utils/permissions-handler';
import { appSettingsService } from '../app-settings-service';
import { disposeBrowserApiServicesRenderWorker } from '../browser-api/browser-api-services-render-worker-instance';
import { getConfiguration } from '../configuration';
import { fileDownloadListener } from '../download-manager';
import { localeService } from '../locale';
import { mainService } from '../main-service';
import { disposeDragService } from '../native-drag-service/native-drag-configuration';
import { passwordManagerService } from '../password-manager';
import { settingsProvider } from '../settings';
import { clearAppCache, clearAppCookies } from '../settings/cache';
import { themeManager } from '../settings/theme';
import { trackEventService } from '../track-event-service';
import { autoUpdateService, UpdateStatus } from '../update';
import { authenticationHandler, ClaimsContainer, userService } from '../user';
import { windowService } from '../window';
import { openLink } from '../window/tab/open-link';
import { canFollowAutoSaveFlow, dispatchBeforeUnloadToChartTabs } from '../window/tab/shutdown-checks';
import { TvTab } from '../window/tab/tv-tab';
import { WindowServiceEvents } from '../window/with-listener';
import { APP_EVENT_SERVICE_CONTRACT, IAppEventService } from './iapp-event-service';

@ExposeSingletonService(APP_EVENT_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('AppEventService')
export class AppEventService implements IAppEventService {
	private appReadyToQuit = false;
	private closing = false;
	private autosaveInProgress = false;
	private readonly permissionsHandler = new PermissionsHandler();

	private readonly startupSubject = new ReplaySubject<void>(1);
	private readonly shutdownSubject = new Subject<void>();

	readonly startup = this.startupSubject.asObservable();
	readonly shutdown = this.shutdownSubject.asObservable();

	private cid?: string;
	private startupTimestamp?: number;

	private isRegisteredForRelaunch = false;

	private loginAttemptsCounter = 0;

	private electronAppQuit: () => void;
	private electronAppExit: (exitCode?: number) => void;
	private electronAppRelaunch: (options?: RelaunchOptions) => void;
	private electronAppRelaunchOptions: RelaunchOptions | undefined;

	constructor() {
		this.electronAppQuit = app.quit;
		this.electronAppExit = app.exit;
		this.electronAppRelaunch = app.relaunch;

		app.quit = (): void => {
			this.appQuit();
		};

		app.exit = (exitCode?: number): void => {
			this.electronRelaunchIfRegistered();
			this.electronAppExit.call(app, exitCode);
		};

		app.relaunch = (options?: RelaunchOptions): void => {
			this.electronAppRelaunchOptions = options;
			this.registerApplicationRestart();
		};

		const openAuthUrl = (url: string): void => {
			if (isTradingviewProtocol(url)) {
				authenticationHandler().acceptRedirectUrl(url);
			}
		};

		loggerService().info('Initializing AppEventService');

		app
			.on('login', (event, webContents, details, authInfo, callback) => {
				loggerService().info('Proxy connection: try login to proxy');

				if (this.loginAttemptsCounter === 0) {
					event.preventDefault();
				}
				else {
					loggerService().error('Proxy connection: failed login attempt');
				}

				passwordManagerService().getCredentialsByService(PROXY_SERVICE_NAME)
					.then((credentials) => {
						if (!credentials) {
							loggerService().error('Proxy connection: not password credentials');
							return;
						}

						const account = credentials.find((c) => c.account === PROXY_SERVICE_ACCOUNT_NAME)?.password.trim() ?? '';
						const password = credentials.find((c) => c.account === PROXY_SERVICE_PASSWORD_NAME)?.password.trim() ?? '';

						// passwordManagerService().setPassword() is called twice below because account and password
						// are stored separately as key: value pair, i.e. key: account, key: password. this is required
						// because keytar cannot store key: value pair with empty or without value (a proxy may be used
						// without password)
						passwordManagerService().setPassword(PROXY_SERVICE_ACCOUNT_NAME, account, PROXY_SERVICE_NAME);
						passwordManagerService().setPassword(PROXY_SERVICE_PASSWORD_NAME, password, PROXY_SERVICE_NAME);

						callback(account, password);
						this.loginAttemptsCounter++;
					})
					.catch((err) => {
						loggerService().error(`passwordManagerService error: ${ getMessageOfError(err) }`);
					});
			})
			.on('activate', () => {
				loggerService().debug('App activate');
				// On OS X it's common to re-create a window in the app when the
				// dock icon is clicked and there are no other windows open.
			})
			.on('did-become-active', () => {
				// Fixed focus after cmd+tab for macOS. The "did-become-active" event exists only on macOS
				this.focusWebContent();
			})
			.on('browser-window-focus', () => {
				// Fixed focus after cmd+tab
				this.focusWebContent();
			})
			.on('second-instance', (ev, argv) => {
				loggerService().debug('Electron.App (second-instance): AppEventsServiceHandler');
				if (argv.findIndex(arg => arg === '--exit') > -1) {
					this.electronQuit();
					return;
				}

				const tvAuthUrl = argv.find(arg => arg.startsWith(`${ APP_PROTOCOL }://`));

				if (tvAuthUrl) {
					openAuthUrl(tvAuthUrl);
					return;
				}

				if (isWin32()) {
					this.openForwardedUrl(argv.at(-1));
				}
			})
			.on('open-url', (ev, url) => {
				openAuthUrl(url);
			})
			.on('window-all-closed', () => {
				loggerService().debug('Electron.App (window-all-closed)');

				this.appQuit();
			})
			.on('before-quit', (ev) => {
				if (!this.appReadyToQuit) {
					loggerService().info('Electron.App (before-quit): prevent app quit and redirect to appEventService().appQuit()');
					ev.preventDefault();
					this.appQuit();
					return;
				}

				loggerService().info('Electron.App (before-quit)');
			})
			.on('quit', () => {
				loggerService().info('Electron.App (quit)');

				autoUpdateService().dispose();
				loggerService().dispose();
			})
			.on('certificate-error', (ev) => {
				ev.preventDefault();
			});
	}

	@logCall
	private async autoSaveFlow(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<void> {
		loggerService().info('Start quit app with auto save');

		windowService().getLastFocusedWindow()?.show();
		await windowService().saveAllChanges(beforeUnloadMessages);
	}

	@logCall
	private focusWebContent(): void {
		const lastFocusWnd = BrowserWindow.getFocusedWindow();
		if (!lastFocusWnd || lastFocusWnd.isDestroyed()) {
			return;
		}

		const lastChild = lastFocusWnd.getChildWindows().at(-1);

		if (lastChild && !lastChild.isDestroyed()) {
			lastChild.webContents.focus();
			return;
		}

		const wnd = lastFocusWnd.getBrowserView()?.webContents;
		if (wnd && !wnd.isDestroyed()) {
			wnd.focus();
		}
	}

	isClosing(): boolean {
		return this.closing;
	}

	isAutosaveInProgress(): boolean {
		return this.autosaveInProgress;
	}

	setIsAutosaveInProgress(value: boolean): void {
		this.autosaveInProgress = value;
	}

	@logCall
	getCid(): string | undefined {
		return this.cid;
	}

	@logCall
	private checkFirstRun(): void {
		this.cid = appSettingsService().get('cid');
		const isRunBefore = appSettingsService().get('isRunBefore');

		if (!isRunBefore) {
			trackEventService().setFirstRunEvent();

			appSettingsService().set('isRunBefore', true);
		}
	}

	@logCall
	async doStartup(): Promise<void> {
		// need to receive notifications on windows in development mode
		if (isWin32() && mainService().isDebugMode()) {
			app.setAppUserModelId(process.execPath);
		}

		notificationService().activateIpcNotificationHandler();

		this.startupTimestamp = new Date().getTime();

		this.checkFirstRun();

		const cliArgument = app.commandLine.getSwitchValue('options');
		if (cliArgument === 'clean') {
			await Promise.all([
				session.defaultSession.clearCache(),
				session.defaultSession.clearAuthCache(),
				session.defaultSession.clearStorageData(),
				persistenceService().clearUserStorage(),
			]);
		}

		process.env[TARGET_TVD_HOST] = getConfiguration().urls.defaultHost;

		await trackEventService().updateAppTrackingStatus();

		ignorePromise(this.initSession());
		this.startupSubject.next();

		userService().userChange.pipe(skip(1)).subscribe((userClaims: ClaimsContainer) => {
			trackEventService().setUserData(userClaims);
		});

		windowService().on(WindowServiceEvents.AllWindowsClosed, () => {
			app.quit();
		});

		windowService().on(WindowServiceEvents.Initialize, () => {
			this.openForwardedUrl(process.argv.at(-1));
		});

		if (!isLinux()) {
			autoUpdateService().checkForUpdates();
		}
	}

	@logCall
	private async userPreventedAppClosingDueToUnsavedChanges(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<boolean> {
		let shouldPreventClose = false;

		if (userService().getCurrentUser().isAuthenticated) {
			shouldPreventClose = await windowService().shouldPreventCloseForUnsavedChanges(beforeUnloadMessages)
				.catch(error => {
					loggerService().error('AppEventService.tryShutdown: WindowService.shouldPreventCloseForUnsavedChanges error', error);

					return false;
				});
		}

		const windows = Array.from(windowService().getChartWindows());
		// When last window is closed there is no need to chek that window has changes (because this already was  within close handler).
		// But user can close application by quit and in the 'last window case' still ne to check unsaved changes.
		const noNeedToCheckUnsavedChanges = windows.length === 1 && windows[0].isClosed;

		return !(noNeedToCheckUnsavedChanges || !shouldPreventClose);
	}

	private trackCloseApp(): void {
		if (this.startupTimestamp) {
			const currentTimestamp = new Date().getTime();
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			const sessionDurationInMinutes = Math.floor((currentTimestamp - this.startupTimestamp) / (1000 * 60));

			// for some reason, sometimes negative sessionDurationInMinutes comes from users. Perhaps due to the fact that users change the time in the system
			const fittedSessionDuration = Math.max(0, sessionDurationInMinutes);

			trackEventService().trackCloseApp(fittedSessionDuration);
		}
	}

	@logCall
	private async initSession(): Promise<void> {
		const ses = session.defaultSession;
		ses.setPreloads([path.join(app.getAppPath(), 'preload/target-tvd-host-preload.js')]);

		if (ses && !ses.getUserAgent().includes('TVDesktop')) {
			ses.setUserAgent(`${ ses.getUserAgent() } TVDesktop/${ app.getVersion() }`);
		}

		const electronAgentRe = / electron\/\S*/i;
		const chromeAgentRe = / Chrome\/\S*/i;
		ses.webRequest.onBeforeSendHeaders((details, callback) => {
			let agent = details.requestHeaders['User-Agent'];
			if (agent) {
				agent = agent.replace(electronAgentRe, '');

				if (details.url.indexOf('accounts.google.com') > 0) {
					agent = agent.replace(chromeAgentRe, '');
				}

				details.requestHeaders['User-Agent'] = agent;
			}

			callback({ cancel: false, requestHeaders: details.requestHeaders });
		});

		ses.on('will-download', fileDownloadListener);

		await themeManager().setPlatformTheme();

		this.permissionsHandler.initialize();

		await networkService().applyProxySettingsForSession(ses);
	}

	@logCall
	private openForwardedUrl(url?: string): void {
		if (!url || !isValidUrl(url)) {
			return;
		}

		if (isLocalURI(url)) {
			return;
		}

		const localizedUrl = localeService().localeAwareUrl(url);

		if (!openLink(localizedUrl)) {
			loggerService().warn(`Open "${ url }" failed or not supported.`);
		}
	}

	@logCall
	private electronQuit(): void {
		this.appReadyToQuit = true;
		this.electronAppQuit.call(app);
	}

	@logCall
	private electronRelaunchIfRegistered(): void {
		if (!this.isRegisteredForRelaunch) {
			return;
		}

		this.isRegisteredForRelaunch = false;
		this.electronAppRelaunch.call(app, this.electronAppRelaunchOptions);
	}

	@logCall
	private win32RelaunchIfRegistered(): void {
		if (!this.isRegisteredForRelaunch) {
			return;
		}

		this.isRegisteredForRelaunch = false;
		registerApplicationRestartAfterUpdateWin32();
	}

	@logCall
	private darwinRelaunchIfRegisteredAndUpdate(): void {
		if (!this.isRegisteredForRelaunch) {
			return;
		}

		this.isRegisteredForRelaunch = false;
		autoUpdateService().startInstallingUpdate();
	}

	@logCall
	private registerApplicationRestart(): void {
		this.isRegisteredForRelaunch = true;
	}

	@logCall
	private appQuit(): void {
		const updateStatus = autoUpdateService().getStatus();
		loggerService().info(`Update status ${ updateStatus }`);
		if (!windowService().mayClose() || this.isClosing() || updateStatus === UpdateStatus.Installing) {
			return;
		}

		const quit = async(): Promise<void> => {
			if (!windowService().mayClose() || this.isClosing()) {
				return;
			}

			this.closing = true;

			await this.saveLocalState();
			await this.saveRemoteState();
			await this.disposeServices();
			await this.performQuitAndRelaunchAndUpdate();
		};

		quit()
			.catch((err) => {
				loggerService().info(`Quit prevented. Reason - ${ getMessageOfError(err) }`);
			})
			.finally(() => {
				this.closing = false;
			});
	}

	@logCall
	private async saveLocalState(): Promise<void> {
		if (!userService().getCurrentUser().isAuthenticated) {
			return;
		}

		try {
			assert(windowService().getCountWindows() !== 0, 'Trying to save empty state');
			return persistenceService().store();
		}
		catch (error) {
			// just skip to avoid softlock
			loggerService().error('Attempt to save empty state', error);
		}
	}

	@logCall
	private async saveRemoteState(): Promise<void> {
		const chartTabs = windowService().getAllChartTabs(true);
		const autoSavePossible = await canFollowAutoSaveFlow(chartTabs);

		/**
		 * the only beforeunload dispatch of this quit attempt; stays empty when the dispatch fails,
		 * which skips the autosave branch and makes the ask path re-dispatch per tab
		 */
		let messages: Map<TvTab, string | undefined> = new Map();
		try {
			messages = await dispatchBeforeUnloadToChartTabs(chartTabs);
		}
		catch (error) {
			loggerService().error('AppEventService.saveRemoteState: dispatchBeforeUnload failed, falling back to asking the user', error);
		}

		if (autoSavePossible && messages.size > 0) {
			const isRecordingIdea = windowService().anyChartTabHasIdeaRecording(
				chartTabs,
				chartTabs.map((chartTab) => messages.get(chartTab)),
			);

			if (!isRecordingIdea) {
				return this.autoSaveFlow(messages);
			}
		}

		if (await this.userPreventedAppClosingDueToUnsavedChanges(messages)) {
			return Promise.reject('The user aborted the close');
		}
	}

	@logCall
	private async disposeServices(): Promise<void> {
		await windowService().dispose();
		await disposeDragService();
		notificationService().dispose();
		settingsProvider().dispose();
		disposeBrowserApiServicesRenderWorker();
		persistenceService().dispose();
		await sessionStorageService().dispose();
	}

	@logCall
	private async performQuitAndRelaunchAndUpdate(): Promise<void> {
		this.trackCloseApp();
		this.shutdownSubject.next();
		const updateTimeout = 3000;
		// Temporary measure to ensure restart during update.
		// Update installation and restart logic will be reworked.
		// Check TVD-2815 for follow-up tasks under which rework will be done.
		const timeoutBeforeElectronQuit = 5000;
		if (autoUpdateService().getStatus() !== UpdateStatus.ReadyToInstall) {
			this.electronRelaunchIfRegistered();
			this.electronQuit();
			return;
		}

		try {
			await clearAppCookies();
			await clearAppCache();
			loggerService().info('AppEventService: cache and cookies were successfully reset');
		}
		catch (error) {
			loggerService().warn(`AppEventService: some error occurred during cache and cookies clearing ${ String(error) }`);
		}

		if (isWin32() && autoUpdateService().getStatus() === UpdateStatus.ReadyToInstall) {
			this.win32RelaunchIfRegistered();

			await sleep(updateTimeout);
			autoUpdateService().startInstallingUpdate();
			await sleep(timeoutBeforeElectronQuit);
		}

		if (isDarwin() && autoUpdateService().getStatus() === UpdateStatus.ReadyToInstall && this.isRegisteredForRelaunch) {
			this.appReadyToQuit = true;
			this.darwinRelaunchIfRegisteredAndUpdate();
			return;
		}

		this.electronQuit();
	}
}
