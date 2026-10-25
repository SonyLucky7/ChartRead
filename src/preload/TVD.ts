import { ipcRenderer } from 'electron';
import '@sentry/electron/preload';

import { IpcLogData } from '../logger';
import { AlertFireControlNotification, AlertFireNotification } from '../notification';
import { TvdSessionStorage } from '../preload-web/session-storage';
import { SentryBreadcrumb } from '../sentry/main';
import { Report } from '../services/interfaces';
import { Credentials } from '../services/password-manager';
import { MediaDevice } from '../services/settings/media';
import { DefaultSystemNameTab } from '../services/settings/settings-tabs';
import { Theme } from '../services/settings/theme';
import { linkingApi } from '../services/window/tab/platform-proxy/tvd-linking-api-extension';
import { Layout } from '../services/window/window-api';
import { RendererData } from '../tv-api/renderer-data';
import * as chan from '../tv-api/tvd-channels';
import { LinkContract, TVD, TvdBase, TvdCredentials, TvdDebug, TvdMedia, TvdNotifications, TvdTab } from '../tv-api/tvd-desktop';
import { crosshairSync } from './crosshair-sync';

const tvdMedia: TvdMedia = {
	async getDesktopStream(): Promise<string> {
		const res = await ipcRenderer.invoke(chan.GET_SCREEN) as string;

		return res;
	},
	async getCurrentCameraDevice(): Promise<string | undefined> {
		// eslint-disable-next-line @typescript-eslint/no-extra-parens
		const savedCamera = await (ipcRenderer.invoke(chan.GET_CAMERA) as Promise<MediaDevice | undefined>);

		if (savedCamera) {
			return tvdObj.findMediaDevice(savedCamera.label, 'videoinput');
		}
	},

	async getCurrentAudioDevice(): Promise<string | undefined> {
		// eslint-disable-next-line @typescript-eslint/no-extra-parens
		const savedAudio = await (ipcRenderer.invoke(chan.GET_AUDIO) as Promise<MediaDevice | undefined>);

		if (savedAudio) {
			return tvdObj.findMediaDevice(savedAudio.label, 'audioinput');
		}
	},

	async findMediaDevice(label: string, kind: MediaDeviceKind): Promise<string | undefined> {
		const platformMediaDevices = await navigator.mediaDevices.enumerateDevices();

		return platformMediaDevices.find(d => d.label === label && d.kind === kind)?.deviceId;
	},

	startedScreenCapture(): void {
		let chartUrl = '';
		if (window) {
			chartUrl = window.location.href;
		}
		ipcRenderer.send(chan.SCREEN_CAPTURE, true, chartUrl);
	},

	stoppedScreenCapture(): void {
		let chartUrl = '';
		if (window) {
			chartUrl = window.location.href;
		}
		ipcRenderer.send(chan.SCREEN_CAPTURE, false, chartUrl);
	},
};

const tvdTab: TvdTab = {
	setTitle(rendererData: RendererData): void {
		ipcRenderer.send(chan.SET_TITLE, rendererData);
	},
	reloadTab(): void {
		ipcRenderer.send(chan.RELOAD_TAB);
	},
	layoutChange(layout: Layout): void {
		ipcRenderer.send(chan.LAYOUT_CHANGE, layout);
	},
	getActiveWatchlistId(): Promise<string | undefined> {
		return ipcRenderer.invoke(chan.GET_WATCHLIST) as Promise<string | undefined>;
	},
	onActiveWatchlistIdChange(id: string): void {
		ipcRenderer.send(chan.WATCHLIST_CHANGE, id);
	},
	layoutRestored(): void {
		ipcRenderer.send(chan.LAYOUT_RESTORED);
	},
	setFocusPineEditor(hasFocus: boolean): void {
		ipcRenderer.send(chan.FOCUS_PINE_EDITOR, hasFocus);
	},
};

const tvdNotifications: TvdNotifications = {
	setNotification(notification: AlertFireNotification | AlertFireControlNotification): void {
		ipcRenderer.send(chan.SEND_NOTIFICATION, notification);
	},
	setNotificationViewed(): void {
		ipcRenderer.send(chan.SET_NOTIFICATION_VIEWED);
	},
};

const tvdCredentials: TvdCredentials = {
	setCredentials(credentials: Credentials): Promise<void> {
		return ipcRenderer.invoke(chan.SAVE_CREDENTIALS, credentials) as Promise<void>;
	},

	getCredentials(): Promise<Credentials[] | undefined> {
		return ipcRenderer.invoke(chan.GET_CREDENTIALS) as Promise<Credentials[] | undefined>;
	},
	insertCredentialsText(credentials: Credentials): Promise<void> {
		return ipcRenderer.invoke(chan.INSERT_TEXT, credentials) as Promise<void>;
	},
};

const base: TvdBase = {
	setLocale(langid: string): void {
		ipcRenderer.send(chan.SET_LOCALE, langid);
	},
	getTheme(): Promise<string> {
		return ipcRenderer.invoke(chan.GET_THEME) as Promise<string>;
	},
	getThemeSetting(): Promise<Theme> {
		return ipcRenderer.invoke(chan.GET_THEME_SETTING) as Promise<Theme>;
	},
	setThemeSetting(theme: Theme): void {
		ipcRenderer.send(chan.SET_THEME_SETTING, theme);
	},
	async getReports(): Promise<Report[]> {
		const res = await ipcRenderer.invoke(chan.GET_REPORTS) as Report[];

		return res;
	},
	signIn(): void {
		ipcRenderer.send(chan.SIGN_IN);
	},
	openSettings(currentActiveTab?: DefaultSystemNameTab): void {
		ipcRenderer.send(chan.OPEN_SETTINGS, currentActiveTab);
	},
	openNewWindow(url: string, height?: number, width?: number): void {
		ipcRenderer.send(chan.OPEN_NEW_WINDOW, url, height, width);
	},
	log(logData: IpcLogData): void {
		ipcRenderer.invoke(chan.LOG, logData) as Promise<void>;
	},
	sendToSentry(sentryBreadcrumb: SentryBreadcrumb): void {
		ipcRenderer.invoke(chan.SEND_TO_SENTRY_BREADCRUMB, sentryBreadcrumb) as Promise<void>;
	},
	crosshairSyncEnabled: crosshairSync(),
	sessionStorage: TvdSessionStorage,
};

const contracts = {
	link: {
		[LinkContract.OpenExternal]: LinkContract.OpenExternal,
	},
};

const debug: TvdDebug = {
	openAutosaveDialogDebug(): void {
		ipcRenderer.send(chan.DEBUG_AUTO_SAVE_DIALOG, true);
	},
	closeAutosaveDialogDebug(): void {
		ipcRenderer.send(chan.DEBUG_AUTO_SAVE_DIALOG, false);
	},
	errorAutosaveDialogDebug(): void {
		ipcRenderer.send(chan.DEBUG_AUTO_SAVE_DIALOG, false, true);
	},
};

export const tvdObj: TVD = {
	...tvdMedia,
	...tvdTab,
	...tvdNotifications,
	...tvdCredentials,
	...base,
	...debug,
	contracts,
	linkingApi,
};
