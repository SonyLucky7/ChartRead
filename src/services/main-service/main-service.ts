import { app, BrowserWindow, desktopCapturer, Display, ipcMain, nativeImage, screen, WebContents } from 'electron';
import fsPromises from 'fs/promises';
import i18next from 'i18next';
import * as path from 'path';
import { Subject } from 'rxjs';
import { ButtonColor, ButtonVariant } from '@tradingview/ui-lib/buttons/types';

import { getSplashData, isRegularSplash } from '../../app/splash/promo-events';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { performanceService } from '../../performance';
import { AttachPersistentRoot, PersistentCompoundObject, PersistentField } from '../../persistence';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { registerSentryEffect } from '../../sentry/effects';
import { DEBUG_AUTO_SAVE_DIALOG, GET_CREDENTIALS, GET_REPORTS, GET_SCREEN, GET_WATCHLIST, INSERT_TEXT, SAVE_CREDENTIALS, SET_LOCALE, SIGN_IN } from '../../tv-api';
import { ignorePromise, isDarwin, isWin32, keyPressHelper, UndoStack } from '../../utils';
import { appRepositoryType } from '../../utils/application-repository-type';
import { getBuildInfo } from '../../utils/build-info';
import { jsonParse } from '../../utils/json-parse';
import { appEventService } from '../app-event-service';
import { getConfiguration } from '../configuration';
import { BuildInfo, ILicenses, Report } from '../interfaces';
import { localeService, setupI18nLocaleHandler } from '../locale';
import { Credentials, CredentialsToInput, passwordManagerService } from '../password-manager';
import { setCredentialsHandler } from '../password-manager/helper';
import reportsService from '../reports-service';
import { userService } from '../user';
import { windowService } from '../window';
import { DialogWindow } from '../window/dialog-window';
import { SaveChangesScopeType } from '../window/tab/save-changes-types';
import { TvTab } from '../window/tab/tv-tab';
import { DialogActionType, DialogOption, OptionsDialogData, OptionsInputSnapshot } from '../window/window-api';
import { getWindowIconPath } from '../window/window-options';
import { WindowServiceEvents } from '../window/with-listener';
import { IMainService, MAIN_SERVICE_CONTRACT } from './imain-service';

@ExposeSingletonService(MAIN_SERVICE_CONTRACT, IpcServices.getProvider())
@AttachPersistentRoot('globals')
@PersistentCompoundObject
@logCallName('MainService')
export class MainService implements IMainService {
	private readonly displayScaleSubject = new Subject<Display>();
	readonly displayScaleChange = this.displayScaleSubject.asObservable();

	private readonly maxUndoStackSize = 30;
	@PersistentField({ name: 'undo' })
	readonly undo: UndoStack = new UndoStack(undefined, this.maxUndoStackSize);

	constructor() {
		loggerService().debug('Initializing MainService');

		this.subscribeAppEvents();
		setupI18nLocaleHandler();
		// eslint-disable-next-line max-len
		loggerService().info(`Main service created. appPath: '${ app.getAppPath() }', documentsPath: '${ FileSystemProvider.getAppDocumentsPath() ?? 'documents path is unavailable !' }' `);
	}

	private showSplashWindow(): void {
		loggerService().info('Show Splash Window');

		const config = getConfiguration();
		const splashConfig = config.windows.splash;

		let splash: BrowserWindow | undefined = new BrowserWindow({
			frame: false,
			alwaysOnTop: true,
			show: false,
			closable: true,
			width: splashConfig.width,
			height: splashConfig.height,
			icon: getWindowIconPath(),
			resizable: false,
			transparent: true,
			webPreferences: {
				devTools: this.isDebugMode(),
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		if (this.isDebugMode() && (splashConfig.showDevTools ?? false)) {
			splash.webContents.openDevTools({ mode: 'detach' });
		}

		const viewPath = path.join(app.getAppPath(), 'app/splash', 'index.html');
		const splashData = getSplashData();

		const loadOptions = {
			query: { rendererInitialData: JSON.stringify({ splashData }) },
		};

		splash.loadFile(viewPath, loadOptions)
			.then(() => {
				splash?.show();
			})
			.catch((error: unknown) => {
				loggerService().error('Splash load error', error);
			});

		const closeSplash = (): void => {
			if (!splash || splash.isDestroyed()) {
				return;
			}

			splash.close();
			splash.destroy();
			splash = undefined;

			unregisterCallback();
		};

		const unregisterCallback = registerSentryEffect(closeSplash);

		windowService().on(WindowServiceEvents.Initialize, () => {
			loggerService().info('Hide Splash Window');

			const splashClosingDelayTime = 3000;
			const splashClosingDelay = isRegularSplash(splashData.postfix) ? 0 : splashClosingDelayTime;

			setTimeout(() => closeSplash(), splashClosingDelay);
		});
	}

	@logCall
	async getLicenses(): Promise<ILicenses | undefined> {
		let licenses: ILicenses | undefined;

		try {
			const licensesPath = path.join(app.getAppPath(), 'resources', 'licenses');

			const jsonData = await fsPromises.readFile(path.join(licensesPath, 'licenses.json'), { encoding: 'utf8' });
			const parsedLicenses = jsonParse<ILicenses>(jsonData);

			if (!parsedLicenses) {
				loggerService().error('[MainService.getLicenses()]: JSON.parse error');
			}
			else {
				licenses = parsedLicenses;
			}
		}
		catch (err) {
			loggerService().error('[MainService.getLicenses()] Error at read licenses', err);
		}

		return licenses;
	}

	@logCall
	getVersionInfo(): Promise<BuildInfo> {
		return getBuildInfo();
	}

	isDebugMode(): boolean {
		return getConfiguration().advanced.debugMode;
	}

	@logCall
	beforeStateApplying(): void {

	}

	@logCall
	stateApplied(): void {

	}

	@logCall
	private subscribeAppEvents(): void {
		appEventService().startup.subscribe(() => {
			performanceService().notify('Startup ');
			this.printBuildConfig();

			this.showSplashWindow();
			this.registerOsTasks();
		});

		userService().userSignedOut.subscribe(() => {
			this.undo.clear();
		});

		ipcMain.handle(GET_SCREEN, (ev) => {
			return this.handleGetScreen(ev.sender);
		});

		ipcMain.handle(GET_REPORTS, () => {
			return this.handleGetReports();
		});

		ipcMain.handle(GET_CREDENTIALS, () => {
			return this.handleGetCredentials();
		});

		ipcMain.handle(SAVE_CREDENTIALS, async(ev, credentials: Credentials) => {
			await this.handleSetCredentials(ev.sender, credentials);
		});

		ipcMain.on(SET_LOCALE, (ev, locale: string): void => {
			this.handleSetLocale(locale);
		});

		ipcMain.on(SIGN_IN, () => {
			this.handleSignIn();
		});

		ipcMain.handle(INSERT_TEXT, (ev, credentials: CredentialsToInput) => {
			this.handleNativeInput(ev.sender, credentials);
		});

		ipcMain.handle(GET_WATCHLIST, (ev) => {
			return this.handleGetWatchlist(ev.sender);
		});

		ipcMain.on(DEBUG_AUTO_SAVE_DIALOG, (ev, isOpen: boolean, hasError?: boolean) => {
			if (!this.isDebugMode()) {
				return;
			}

			const wnd = windowService().getWindowByViewId(ev.sender.id);
			if (!wnd) {
				return;
			}

			if (isOpen) {
				ignorePromise(wnd.showSaveChangesDialog({ type: SaveChangesScopeType.Debug, id: wnd.persistentId }));
				return;
			}

			if (hasError) {
				windowService().saveChangesErrorSubject.next({ scopeId: wnd.persistentId, hasError: true });
				return;
			}

			wnd.disposeSaveChangesDialog();
		});

		screen.on('display-metrics-changed', (ev, display, metrics) => {
			if (!metrics.includes('scaleFactor')) {
				return;
			}
			this.displayScaleSubject.next(display);
		});
	}

	private printBuildConfig(): void {
		loggerService().info(`Build config: version=${ app.getVersion() }, repositoryType=${ appRepositoryType() }`);
	}

	@logCall
	private registerOsTasks(): void {
		if (!isWin32()) {
			return;
		}

		app.setUserTasks([
			{
				program: process.execPath,
				arguments: '--exit',
				iconPath: process.execPath,
				iconIndex: 0,
				title: 'Exit',
				description: 'Close and save all windows',
			},
		]);
	}

	private async handleGetScreen(senderWebContents: WebContents): Promise<string | undefined> {
		loggerService().info('Requested screen recording from platform');
		const externalSources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 250, height: 130 } });
		let internalSources: Electron.DesktopCapturerSource[] = [];

		if (isWin32()) {
			internalSources = await this.getInternalScreenRecordSources();
		}

		const dialogData = new OptionsDialogData(
			[...externalSources, ...internalSources]
				.filter((src) => !src.thumbnail.isEmpty())
				.map<DialogOption>(({ id, name, thumbnail }) =>
					({
						id,
						name,
						data: thumbnail.toDataURL(),
					})
				),
			i18next.t('Share the screen'),
			i18next.t('TradingView wants to provide access to your screen. Select the window you want to show.'),
			[
				{
					id: DialogActionType.Cancel,
					text: i18next.t('Cancel'),
					color: ButtonColor.Gray,
					variant: ButtonVariant.Secondary,
				},
				{
					id: DialogActionType.Allow,
					text: i18next.t('Allow'),
					color: ButtonColor.Black,
					variant: ButtonVariant.Primary,
				},
			]
		);

		const userResponse = await DialogWindow.showDialogWindow({
			data: dialogData,
			isModal: isDarwin(),
			size: { width: 570, height: 584 },
			parentWindow: windowService().findWindow({ tabWebContents: senderWebContents })?.windowRef,
			closeOnSubmit: true,
		});

		if (!userResponse || userResponse.button === 0) {
			loggerService().info('User cancelled screen recording');
			return;
		}

		const options = (userResponse.input as OptionsInputSnapshot)?.options;

		if (options) {
			loggerService().info('Returning screen recording selected option');
			return options[0]?.id;
		}
	}

	private async handleGetReports(): Promise<Report[]> {
		loggerService().debug('Platform requested reports');
		return await reportsService().getSupportAttachments();
	}

	private async handleGetCredentials(): Promise<Credentials[] | undefined> {
		loggerService().info('Platform requested credentials');
		const credentials = await passwordManagerService().getCredentialsByService();

		return credentials;
	}

	private async handleSetCredentials(sender: WebContents, credentials: Credentials): Promise<void> {
		const window = BrowserWindow.fromWebContents(sender);

		if (!window) {
			return;
		}

		await setCredentialsHandler(credentials, window);
	}

	private handleSetLocale(locale: string): void {
		loggerService().debug('Platform requested set locale');
		localeService().setLocale(locale);
	}

	private handleSignIn(): void {
		loggerService().debug('Platform requested sign in');
		userService().doSignIn('platform');
	}

	private async getInternalScreenRecordSources(): Promise<Electron.DesktopCapturerSource[]> {
		const internalSources: Electron.DesktopCapturerSource[] = [];

		const appWindows = windowService().getChartWindows();

		for (const appWindow of appWindows) {
			const appWindowId = appWindow.windowRef.getMediaSourceId();
			const appWindowIconPath = getWindowIconPath();

			if (
				appWindow.activeTabId === null ||
				appWindowIconPath === undefined ||
				/**
				 * TODO: look into weird things:
				 * 1. if there is no icon we cannot select a source
				 * 2. why is the duplication source ran every time
				 */
				internalSources.some((source) => source.id === appWindowId)
			) {
				continue;
			}

			const appWindowActiveTabPosition = appWindow.getTabIndex(appWindow.activeTabId);

			const appWindowThumbnail = await appWindow.tabs[appWindowActiveTabPosition].capturePage();
			const appWindowDisplayId = appWindowId.split(':')[1];
			const resizedAppWindowThumbnail = appWindowThumbnail.resize({ height: 135, width: 240 });

			internalSources.push({
				name: appWindow.windowRef.getTitle(),
				id: appWindowId,
				// eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
				display_id: appWindowDisplayId,
				appIcon: nativeImage.createFromPath(appWindowIconPath),
				thumbnail: resizedAppWindowThumbnail,
			});
		}

		return internalSources;
	}

	private handleNativeInput(senderWebContents: WebContents, credentials: CredentialsToInput): void {
		if (credentials.accountLength) {
			for (let i = 0; i <= credentials.accountLength; i++) {
				keyPressHelper(senderWebContents, 'Backspace');
			}
		}
		for (const char of credentials.account) {
			senderWebContents.sendInputEvent({ type: 'char', keyCode: char });
		}
		keyPressHelper(senderWebContents, 'Tab');
		if (credentials.passwordLength) {
			for (let i = 0; i <= credentials.passwordLength; i++) {
				keyPressHelper(senderWebContents, 'Backspace');
			}
		}
		for (const char of credentials.password) {
			senderWebContents.sendInputEvent({ type: 'char', keyCode: char });
		}
	}

	private handleGetWatchlist(senderWebContents: WebContents): string | undefined {
		const window = windowService().findWindow({ tabWebContents: senderWebContents });
		const tab = window?.findTabByWebContents(senderWebContents);
		if (tab === null) {
			return;
		}

		return (tab as TvTab).watchlist;
	}
	// private recordingTracePromise: Promise<unknown> | undefined;

	// startTraceRecording(): void {
	// 	if (!this.recordingTracePromise) {
	// 		loggerService().log('Trace started');
	// 		this.recordingTracePromise = contentTracing.startRecording({ categoryFilter: '*', traceOptions: 'record-until-full,enable_sampling,enable_systrace' });
	// 	}
	// }
	// stopTraceRecording(): void {
	// 	if (!this.recordingTracePromise) {
	// 		return;
	// 	}

	// 	ignorePromise(this.recordingTracePromise
	// 		.then(() =>
	// 			contentTracing.stopRecording(`${__dirname}/trace${getUID()}.json`)
	// 				.then((p) => {
	// 					loggerService().debug(`Trace saved`);
	// 					this.recordingTracePromise = undefined;
	// 				})
	// 				.catch(err => loggerService().error('Error saving trace', err))
	// 		));
	// }
}
