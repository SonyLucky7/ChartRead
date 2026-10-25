import { app, ipcMain, Notification, powerMonitor } from 'electron';

import { loggerService } from '../logger';
import { appSettingsService } from '../services/app-settings-service';
import { soundPlayerServiceProxy } from '../services/browser-api';
import { windowService } from '../services/window';
import { TvTab } from '../services/window/tab/tv-tab';
import { TabbedWindow } from '../services/window/tabbed-window-imports';
import { SET_NOTIFICATION_VIEWED } from '../tv-api/tvd-channels';
import { closeAlertPopupHelper } from '../tv-services/tv-api-helper';
import { isDarwin, isLinux, isWin32 } from '../utils';
import { AlertNotification, isAlertFireControlNotification, isAlertFireNotification, isSoundParams, SoundParams } from './alert';
import { isNotificationAllowedDarwin } from './macos-notification-state-wrapper';

// Notes for poor soul thats going to refactor any of these in the future:
// Historycally this class was the NotificationService however in reality it was always specialized in showing
// only alerts notifications from platform(price alerts and others)
// If theres ever a need to extend Notification functionality to show other types of notifications creating separate class/abstraction is
// strongly adviced. However some shared/generic notification logic may be extracted from here
export class AlertNotifier {
	private notification: Notification | null = null;
	private lastShownTime: Date | null = null;
	private shouldPlayNotificationSound = false;
	private notificationSoundTimeout: NodeJS.Timeout | null = null;

	constructor() {
		this.setupNotificationViewHandler();
	}

	public allowAlertNotificationsSoundOnce(): void {
		const noNotificationSoundsStartupDelay = 30_000;

		if (this.notificationSoundTimeout === null && !this.shouldPlayNotificationSound) {
			this.notificationSoundTimeout = setTimeout(() => {
				this.shouldPlayNotificationSound = true;
			}, noNotificationSoundsStartupDelay);
		}
	}

	private setupNotificationViewHandler(): void {
		ipcMain.on(SET_NOTIFICATION_VIEWED, () => {
			loggerService().debug(`[AlertNotifier.setupNotificationViewHandler()] (${ SET_NOTIFICATION_VIEWED })`);

			this.toggleBadge(false);

			this.notificationClose();
		});
	}

	private onNotificationClose(): void {
		soundPlayerServiceProxy().stopSound();

		const fastCloseInterval = 200;
		const isNotificationClosedImmideatly = this.lastShownTime !== null && new Date().getTime() - this.lastShownTime.getTime() < fastCloseInterval;

		if (powerMonitor.getSystemIdleState(1) !== 'locked') {
			this.toggleBadge(false);

			if (!isNotificationClosedImmideatly) {
				this.closePlatformPopup()
					.catch(() => {
						loggerService().warn('[AlertNotifier.onNotificationClose()] closePlatformPopup error');
					});
			}
		}
	}

	private async closePlatformPopup(): Promise<void> {
		const wnd = windowService().getLastFocusedWindow();
		if (wnd === undefined) {
			return;
		}

		try {
			const activeTab = wnd.activeTab;
			if (activeTab === null) {
				return;
			}

			const closeAlertPopup = `(${ closeAlertPopupHelper.toString() })();`;
			await activeTab.executeJavaScript(closeAlertPopup);
		}
		catch (err) {
			loggerService().error('[AlertNotifier.closePlatformPopup()] Failed to close platform popup', err);
		}
	}

	private onNotificationClick(navigateToNotificationSource?: { chartUrl: string; symbol: string; }): void {
		const wnd = windowService().getLastFocusedWindow();

		if (wnd === undefined) {
			return;
		}

		wnd.show();
		wnd.bringToFront();
		if (isWin32()) {
			wnd.bringOnTop();
		}
		wnd.bringOnTop();

		if (navigateToNotificationSource !== undefined && powerMonitor.getSystemIdleState(1) !== 'locked') {
			this.changeSymbolInActiveTab(wnd, navigateToNotificationSource.chartUrl, navigateToNotificationSource.symbol).catch((err) => {
				loggerService().error('[AlertNotifier.changeSymbolInActiveTab()] Failed to set symbol and interval on tab', err);
			});
		}
	}

	private async changeSymbolInActiveTab(wnd: TabbedWindow, url: string, symbol: string): Promise<any> {
		const activeTab = wnd.activeTab;

		if (activeTab === undefined) {
			await wnd.createAndAddTab({ title: symbol, url });
			return;
		}

		if (activeTab instanceof TvTab) {
			activeTab.changeSymbol(symbol);
		}
	}

	private toggleBadge(show: boolean): void {
		if (!isDarwin()) {
			return;
		}

		const badgeContent = '\u2022';

		app.dock?.setBadge(show ? badgeContent : '');
	}

	private playNotificationSound(soundParams: SoundParams, volume: number): void {
		soundPlayerServiceProxy().playSound({ ...soundParams, volume });
	}

	public notificationShow(notificationData: AlertNotification): void {
		if (!isAlertFireNotification(notificationData) && !isAlertFireControlNotification(notificationData)) {
			loggerService().warn('[AlertNotifier.notificationShow()] Invalid alert notification');
			return;
		}

		this.toggleBadge(true);

		if (!isNotificationAllowedDarwin()) {
			loggerService().debug('[AlertNotifier.notificationShow()] DND settings enabled. Notification will not be shown');
			return;
		}

		const alertSettings = appSettingsService().get('alertSettings');

		if (
			alertSettings.enablePlaySound &&
			alertSettings.volume > 0 &&
			this.shouldPlayNotificationSound &&
			isSoundParams(notificationData.soundParams)
		) {
			this.playNotificationSound(notificationData.soundParams, alertSettings.volume);
		}

		if (!alertSettings.enableShowNotification) {
			return;
		}

		const notification = this.buildAlertNotification(notificationData);

		loggerService().info('[AlertNotifier.notificationShow()] notification show call');
		notification.show();
		this.notification = notification;
	}

	private buildAlertNotification(notificationData: AlertNotification): Notification {
		const notificationOutput = {
			title: notificationData.desktopNotificationTitle,
			body: notificationData.description,
			silent: true,
			toastXml: `
				<toast launch="toast">
					<visual>
						<binding template="ToastGeneric">
							<text>${ notificationData.desktopNotificationTitle }</text>
							<text>${ notificationData.description }</text>
						</binding>
					</visual>
					<audio silent="true"/>
					<commands scenario = "incomingCall"/>
				</toast>`,
		};

		const notification = new Notification(notificationOutput);

		notification.on('show', () => {
			this.lastShownTime = new Date();
		});

		// on windows OS automatic hiding of notifications generates an event no different from manual closing by the user
		// therefore we do not hide notifications automatically
		if (isWin32()) {
			notification.timeoutType = 'never';
		}

		notification.on('close', () => {
			loggerService().info('[AlertNotifier.buildAlertNotification()] on notification close');
			this.onNotificationClose();
		});

		notification.on('click', () => {
			loggerService().info('[AlertNotifier.buildAlertNotification()] on notification click');
			this.onNotificationClose();

			this.onNotificationClick(isAlertFireNotification(notificationData) ? notificationData : undefined);
		});

		return notification;
	}

	private notificationClose(): void {
		soundPlayerServiceProxy().stopSound();
		if (this.notification === null) {
			return;
		}

		this.toggleBadge(false);

		this.notification.close();

		if (isWin32() || isLinux()) {
			this.onNotificationClose();
		}
	}

	public dispose(): void {
		this.notificationClose();
		if (this.notificationSoundTimeout !== null) {
			clearTimeout(this.notificationSoundTimeout);
		}
	}
}
