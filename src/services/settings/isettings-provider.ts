import { BehaviorSubject, Subject } from 'rxjs';

import { MediaDevice } from './media';
import { DefaultSystemNameTab, ShowSettingsOptions } from './settings-tabs';
import { TabTitleState } from './tab-title-interfaces';

export const SETTINGS_PROVIDER_CONTRACT = 'tvd:settings-provider-service';

export type ConfirmationCallback = (confirm: boolean) => void;

interface MediaSettingsProvider {
	appCameraChange: BehaviorSubject<MediaDevice | undefined>;
	appAudioInputChange: BehaviorSubject<MediaDevice | undefined>;
	getCamera(): MediaDevice | undefined;
	getMicrophone(): MediaDevice | undefined;
}

interface AutofillSettingsProvider {
	autofillChange: Subject<boolean>;
}

interface DataResetSettingsProvider {
	clearAppCacheAndCookies(): Promise<void>;
	factoryReset(): Promise<void>;
}

interface AlertSettingsProvider {
	alertSoundEnabledChange: BehaviorSubject<boolean>;
	alertVolumeChange: BehaviorSubject<number>;
	alertNotificationEnabledChange: BehaviorSubject<boolean>;
}

interface FileDownloadSettingsProvider {
	fileSavePathChange: BehaviorSubject<string>;
	showSelectFolderDialogChange: BehaviorSubject<boolean>;
	changeFileSavePath(): void;
	isFileSavePathValid(): boolean;
	getFileSavePath(): string;
}

interface BaseSettingsProvider {
	isSeeOnboardingBeforeSubject: BehaviorSubject<boolean>;
	hardwareAccelerationChange: BehaviorSubject<boolean>;

	saveSymbolIntervalChange: BehaviorSubject<boolean>;
	crosshairSyncEnabledChange: BehaviorSubject<boolean>;

	showSettings(options?: ShowSettingsOptions): void;
	dispose(): void;
	currentActiveTab: DefaultSystemNameTab;
	setCurrentSettingsActiveTab(tab: DefaultSystemNameTab): void;
}

interface TabSettingsProvider {
	saveSymbolIntervalChange: BehaviorSubject<boolean>;
	tabChange: BehaviorSubject<TabTitleState[]>;
	macosHideTabsInFullscreenChange: BehaviorSubject<boolean>;
	recomputeFullscreenedWindowsBounds(isTabPanelHidden: boolean): void;
}

export type ISettingsProvider =
	MediaSettingsProvider & AutofillSettingsProvider
	& DataResetSettingsProvider & AlertSettingsProvider
	& FileDownloadSettingsProvider & BaseSettingsProvider
	& TabSettingsProvider;
