import { merge } from 'merge-anything';

import { logCall, logCallName } from '../logger/log-decorator';
import { ProxyProtocol } from '../main/network/proxy-protocol';
import { FileSystemProvider } from '../providers/file-system-provider';
import { getUID } from '../tvd-runtime/core';
import { ignorePromise, isDarwin } from '../utils';
import { jsonParse } from '../utils/json-parse';
import { MediaDevice } from './settings/media';
import { DEFAULT_TAB_SETTINGS, TabTitleState } from './settings/tab-title-interfaces';
import { Theme } from './settings/theme';

export interface AlertSettings {
	enablePlaySound: boolean;
	enableShowNotification: boolean;
	volume: number;
}

export interface AppSettings {
	isRunBefore: boolean;
	isFirstSuccessfullAuthAttempt: boolean;
	isSeeOnboardingBefore: boolean;
	cid: string;
	disableHardwareAcceleration: boolean;
	saveCredentials: boolean;
	alertSettings: AlertSettings;
	fileSaveDefaultPath: string;
	showFolderSelectDialog: boolean;
	saveSymbolInterval: boolean;
	forcedMacOsEnableHardwareAcceleration: boolean;
	lastStartVersion: string | undefined;
	updateFailsCount: number;
	lastUpdateTime: string | undefined;
	tabTitle: TabTitleState[];
	crosshairSyncEnabled: boolean;
	macosHideTabsInFullscreen: boolean;
	theme: Theme;
	isAppTrackingEnabled: boolean;
	currentLocale: string;
	isProxyEnabled: boolean;
	proxyProtocol: ProxyProtocol;
	proxyServerIpAddress: string;
	proxyServerPort: string;
	appAudioInputId?: MediaDevice;
	appCameraId?: MediaDevice;
}

type KeyType = keyof AppSettings;

export interface IAppSettingsService {
	get<T extends KeyType>(key: T): AppSettings[T];
	set<T extends KeyType>(key: T, value: AppSettings[T]): void;
	restoreDefaults(): Promise<void>;
	getSettings(): AppSettings;
}

@logCallName('AppSettingsService')
class AppSettingsService implements IAppSettingsService {
	private settings: AppSettings;
	private defaultSettings: AppSettings;

	private appStoragePath: string;
	private settingsWriteOp: Promise<void> | undefined;

	constructor() {
		this.appStoragePath = FileSystemProvider.getAppStateFilePath();

		this.defaultSettings = {
			isRunBefore: false,
			isFirstSuccessfullAuthAttempt: false,
			isSeeOnboardingBefore: false,
			cid: getUID(),
			disableHardwareAcceleration: false,
			saveCredentials: !isDarwin(),
			forcedMacOsEnableHardwareAcceleration: false,
			fileSaveDefaultPath: FileSystemProvider.getDefaultAppPath('downloads') ?? '',
			showFolderSelectDialog: false,
			saveSymbolInterval: true,
			alertSettings: {
				enablePlaySound: true,
				enableShowNotification: true,
				volume: 100,
			},
			lastStartVersion: undefined,
			updateFailsCount: 0,
			lastUpdateTime: undefined,
			tabTitle: DEFAULT_TAB_SETTINGS,
			crosshairSyncEnabled: true,
			macosHideTabsInFullscreen: false,
			theme: 'system',
			isAppTrackingEnabled: false,
			currentLocale: 'en',
			proxyServerIpAddress: '',
			proxyServerPort: '',
			proxyProtocol: ProxyProtocol.Http,
			isProxyEnabled: false,
		};

		this.settings = this.readSettings();

		this.settings.alertSettings = {
			...this.settings.alertSettings,
			volume: this.settings.alertSettings.enablePlaySound === false ? 0 : this.settings.alertSettings.volume,
		};

		ignorePromise(this.saveSettings());
	}

	set<T extends KeyType>(key: T, value: AppSettings[T]): void {
		if (this.settings[key] === value) {
			return;
		}

		this.settings[key] = value;
		ignorePromise(this.saveSettings());
	}

	get<T extends KeyType>(key: T): AppSettings[T] {
		return this.settings[key];
	}

	@logCall
	restoreDefaults(): Promise<void> {
		this.settings = {
			...this.defaultSettings,
			isRunBefore: this.settings.isRunBefore,
			cid: getUID(),
		};
		return this.saveSettings();
	}

	@logCall
	getSettings(): AppSettings {
		return this.settings;
	}

	private readSettings(): AppSettings {
		if (!FileSystemProvider.exists(this.appStoragePath)) {
			return this.defaultSettings;
		}

		const settingsFileContent = FileSystemProvider.readFileSync(this.appStoragePath);

		if (!settingsFileContent) {
			return this.defaultSettings;
		}

		let settings: Partial<AppSettings> | undefined;

		try {
			const parsedSettings = jsonParse<Partial<AppSettings>>(settingsFileContent);
			if (!parsedSettings) {
				return this.defaultSettings;
			}
			settings = parsedSettings;
		}
		catch (err) {
			console.error(err);
			return this.defaultSettings;
		}

		return merge(this.defaultSettings, settings);
	}

	private async saveSettings(): Promise<void> {
		try {
			if (this.settingsWriteOp) {
				await this.settingsWriteOp;
			}

			this.settingsWriteOp = FileSystemProvider.writeFileAsync(this.appStoragePath, JSON.stringify(this.settings, undefined, 2));

			await this.settingsWriteOp;
		}
		catch (err) {
			console.error(err);
		}
	}
}

let appSettingsService_: IAppSettingsService | undefined;

export function appSettingsService(): IAppSettingsService {
	if (!appSettingsService_) {
		appSettingsService_ = new AppSettingsService();
	}

	return appSettingsService_;
}
