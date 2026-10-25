import { ipcMain } from 'electron';
import { BehaviorSubject, Subscription } from 'rxjs';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCallName } from '../../logger/log-decorator';
import { networkService } from '../../main/network';
import { CROSSHAIR_SYNC_SETTING_UPDATE, GET_AUDIO, GET_CAMERA, GET_CROSSHAIR_SYNC, OPEN_SETTINGS } from '../../tv-api/tvd-channels';
import { Disposable } from '../../tvd-runtime/core';
import { ignorePromise } from '../../utils';
import { appEventService } from '../app-event-service';
import { AlertSettings, appSettingsService } from '../app-settings-service';
import { passwordManagerService } from '../password-manager';
import { windowService } from '../window';
import { WindowServiceEvents } from '../window/with-listener';
import { clearAppCacheAndCookies, clearData } from './cache';
import { changeFileSavePath, isFileSavePathValid } from './file-download';
import { ISettingsProvider, SETTINGS_PROVIDER_CONTRACT } from './isettings-provider';
import { MediaDevice } from './media';
import { DefaultSystemNameTab, ShowSettingsOptions } from './settings-tabs';
import { showSettingsWindow } from './settings-window';
import { TabTitleState } from './tab-title-interfaces';
import { setSymbolSave } from './tabs';
import { themeManager } from './theme';

@ExposeSingletonService(SETTINGS_PROVIDER_CONTRACT, IpcServices.getProvider())
@logCallName('SettingsProvider')
export class SettingsProvider implements ISettingsProvider, Disposable {
	public currentActiveTab: DefaultSystemNameTab = DefaultSystemNameTab.General;

	isSeeOnboardingBeforeSubject: BehaviorSubject<boolean>;
	// general
	autofillChange: BehaviorSubject<boolean>;
	crosshairSyncEnabledChange: BehaviorSubject<boolean>;
	fileSavePathChange: BehaviorSubject<string>;
	showSelectFolderDialogChange: BehaviorSubject<boolean>;
	// tabs
	saveSymbolIntervalChange: BehaviorSubject<boolean>;
	macosHideTabsInFullscreenChange: BehaviorSubject<boolean>;
	tabChange: BehaviorSubject<TabTitleState[]>;
	// video & audio
	appCameraChange: BehaviorSubject<MediaDevice | undefined>;
	appAudioInputChange: BehaviorSubject<MediaDevice | undefined>;
	// alerts
	alertSoundEnabledChange: BehaviorSubject<boolean>;
	alertVolumeChange: BehaviorSubject<number>;
	alertNotificationEnabledChange: BehaviorSubject<boolean>;
	// service
	hardwareAccelerationChange: BehaviorSubject<boolean>;

	private subscriptions: Subscription[] = [];

	clearAppCacheAndCookies = clearAppCacheAndCookies;
	changeFileSavePath = changeFileSavePath;

	constructor() {
		loggerService().debug('Initializing SettingsProvider');

		this.isSeeOnboardingBeforeSubject = new BehaviorSubject(appSettingsService().get('isSeeOnboardingBefore'));
		// general
		this.autofillChange = new BehaviorSubject(passwordManagerService().getShouldSaveCredentials());
		this.crosshairSyncEnabledChange = new BehaviorSubject(appSettingsService().get('crosshairSyncEnabled'));
		this.fileSavePathChange = new BehaviorSubject(appSettingsService().get('fileSaveDefaultPath'));
		this.showSelectFolderDialogChange = new BehaviorSubject(appSettingsService().get('showFolderSelectDialog'));
		// tabs
		this.saveSymbolIntervalChange = new BehaviorSubject(appSettingsService().get('saveSymbolInterval'));
		this.macosHideTabsInFullscreenChange = new BehaviorSubject(appSettingsService().get('macosHideTabsInFullscreen'));
		this.tabChange = new BehaviorSubject(appSettingsService().get('tabTitle'));
		// video & audio
		this.appCameraChange = new BehaviorSubject(appSettingsService().get('appCameraId'));
		this.appAudioInputChange = new BehaviorSubject(appSettingsService().get('appAudioInputId'));
		// alerts
		const alertSettings = appSettingsService().get('alertSettings');
		this.alertSoundEnabledChange = new BehaviorSubject(alertSettings.enablePlaySound);
		this.alertVolumeChange = new BehaviorSubject(alertSettings.volume);
		this.alertNotificationEnabledChange = new BehaviorSubject(alertSettings.enableShowNotification);
		// service
		this.hardwareAccelerationChange = new BehaviorSubject(appSettingsService().get('disableHardwareAcceleration'));

		// TODO: should be removed after dropping 1.0.2 version support
		windowService().on(WindowServiceEvents.Initialize, () => {
			this.autofillChange.next(passwordManagerService().getShouldSaveCredentials());
		});

		this.subscribeAll();
		this.setPlatformRequestsHandler();
	}

	public getCamera(): MediaDevice | undefined {
		return this.appCameraChange.value;
	}

	public getMicrophone(): MediaDevice | undefined {
		return this.appAudioInputChange.value;
	}

	public getFileSavePath(): string {
		return this.fileSavePathChange.value;
	}

	public isFileSavePathValid(): boolean {
		return isFileSavePathValid(this.fileSavePathChange.value);
	}

	public recomputeFullscreenedWindowsBounds(isTabPanelHidden: boolean): void {
		windowService().recomputeFullscreenedWindowsBounds(isTabPanelHidden);
	}

	private subscribeAll(): void {
		this.subscriptions.push(
			// general
			this.autofillChange.subscribe((value) => {
				passwordManagerService().setShouldSaveCredentials(value);
			}),
			this.crosshairSyncEnabledChange.subscribe((value) => {
				if (appSettingsService().get('crosshairSyncEnabled') === value) {
					return;
				}

				appSettingsService().set('crosshairSyncEnabled', value);
				windowService().broadcastChannel(CROSSHAIR_SYNC_SETTING_UPDATE, value);
			}),
			this.fileSavePathChange.subscribe((value) => {
				if (!isFileSavePathValid(value)) {
					return;
				}
				appSettingsService().set('fileSaveDefaultPath', value);
			}),
			this.showSelectFolderDialogChange.subscribe((value) => {
				appSettingsService().set('showFolderSelectDialog', value);
			}),
			// tabs
			this.saveSymbolIntervalChange.subscribe((value) => {
				setSymbolSave(value);
			}),
			this.macosHideTabsInFullscreenChange.subscribe((value) => {
				appSettingsService().set('macosHideTabsInFullscreen', value);
			}),
			this.tabChange.subscribe((value) => {
				appSettingsService().set('tabTitle', value);
			}),
			// video & audio
			this.appCameraChange.subscribe((value) => {
				appSettingsService().set('appCameraId', value);
			}),
			this.appAudioInputChange.subscribe((value) => {
				appSettingsService().set('appAudioInputId', value);
			}),
			// alerts
			this.alertSoundEnabledChange.subscribe((value) => {
				const settings: AlertSettings = {
					enablePlaySound: value,
					enableShowNotification: this.alertNotificationEnabledChange.value,
					volume: this.alertVolumeChange.value,
				};
				appSettingsService().set('alertSettings', settings);
			}),
			this.alertVolumeChange.subscribe((volume) => {
				const settings: AlertSettings = {
					enablePlaySound: volume > 0,
					enableShowNotification: this.alertNotificationEnabledChange.value,
					volume,
				};
				appSettingsService().set('alertSettings', settings);
			}),
			this.alertNotificationEnabledChange.subscribe((value) => {
				const settings: AlertSettings = {
					enablePlaySound: this.alertSoundEnabledChange.value,
					enableShowNotification: value,
					volume: this.alertVolumeChange.value,
				};
				appSettingsService().set('alertSettings', settings);
			}),
			// service
			this.hardwareAccelerationChange.subscribe((value) => {
				appSettingsService().set('disableHardwareAcceleration', value);
			})
		);

		const shutdownSub = appEventService().shutdown.subscribe(() => {
			shutdownSub.unsubscribe();
			this.dispose();
		});
	}

	showSettings({ currentActiveTab, tabId }: ShowSettingsOptions = {}): void {
		const wnd = tabId
			? windowService().findWindow({ tabId })?.windowRef
			: windowService().getLastFocusedWindow()?.windowRef;

		ignorePromise(showSettingsWindow(wnd, { currentActiveTab }));
	}

	private setPlatformRequestsHandler(): void {
		ipcMain.on(OPEN_SETTINGS, (ev, ...args: [DefaultSystemNameTab]) => {
			const [currentActiveTab] = args;
			const wnd = windowService().findWindow({ tabWebContents: ev.sender });

			ignorePromise(showSettingsWindow(wnd?.windowRef, { currentActiveTab }));
		});

		ipcMain.handle(GET_CAMERA, () => this.appCameraChange.value);
		ipcMain.handle(GET_AUDIO, () => this.appAudioInputChange.value);

		ipcMain.handle(GET_CROSSHAIR_SYNC, () => this.crosshairSyncEnabledChange.value);
	}

	public setCurrentSettingsActiveTab(tab: DefaultSystemNameTab): void {
		this.currentActiveTab = tab;
	}

	private updateSettings(): void {
		// general
		this.autofillChange.next(passwordManagerService().getShouldSaveCredentials());
		this.crosshairSyncEnabledChange.next(appSettingsService().get('crosshairSyncEnabled'));
		this.fileSavePathChange.next(appSettingsService().get('fileSaveDefaultPath'));
		this.showSelectFolderDialogChange.next(appSettingsService().get('showFolderSelectDialog'));
		// tabs
		this.saveSymbolIntervalChange.next(appSettingsService().get('saveSymbolInterval'));
		this.macosHideTabsInFullscreenChange.next(appSettingsService().get('macosHideTabsInFullscreen'));
		this.tabChange.next(appSettingsService().get('tabTitle'));
		// video && audio
		this.appCameraChange.next(appSettingsService().get('appCameraId'));
		this.appAudioInputChange.next(appSettingsService().get('appAudioInputId'));
		// alerts
		const alertSettings = appSettingsService().get('alertSettings');
		this.alertSoundEnabledChange.next(alertSettings.enablePlaySound);
		this.alertNotificationEnabledChange.next(alertSettings.enableShowNotification);
		this.alertVolumeChange.next(alertSettings.volume);
		// service
		this.hardwareAccelerationChange.next(appSettingsService().get('disableHardwareAcceleration'));
		// network
		networkService().resetProxySettings();

		themeManager().themeChange.next(appSettingsService().get('theme'));
	}

	public async factoryReset(): Promise<void> {
		await appSettingsService().restoreDefaults();

		this.updateSettings();

		try {
			await clearData();
		}
		catch (error) {
			loggerService().error('SettingsProvider.factoryReset(): SettingsProvider.clearData() error', error);
		}
	}

	public dispose(): void {
		this.subscriptions.forEach(s => s.unsubscribe());
		themeManager().dispose();
	}
}
