import { ipcMain } from 'electron';

import { loggerService } from '../logger';
import { SEND_NOTIFICATION } from '../tv-api';
import { Disposable } from '../tvd-runtime/core';
import { isAlertNotification } from './alert';
import { AlertNotifier } from './alert-notifier';
import { isTvdNotification, TvdNotification } from './notification';

export class NotificationService implements Disposable {
	private handledIpcNotifications: Set<string> = new Set();
	private alertNotifier = new AlertNotifier();

	constructor() {}

	public activateIpcNotificationHandler(): void {
		ipcMain.on(SEND_NOTIFICATION, (ipcEvent, notification) => {
			if (!isTvdNotification(notification)) {
				loggerService().warn(`Notification service received invalid notification from ${ SEND_NOTIFICATION } channel`);
				return;
			}
			if (!this.handledIpcNotifications.has(notification.id)) {
				this.handledIpcNotifications.add(notification.id);
				this.dispatchNotification(notification);
			}
		});
	}

	public dispatchNotification(notification: TvdNotification): void {
		if (isAlertNotification(notification)) {
			this.alertNotifier.notificationShow(notification);
			return;
		}
		loggerService().warn(`notification: {
			${ notification.id }
			${ notification.desktopNotificationTitle }
			${ notification.description }
		}, cannot be shown, no Notifier for that type of notification`);
	}

	/**
	* Workaround for blocking notifications sound playback on app Startup
	* When app starts we dont want to blast sound for Alert notifications which were fired before app started
	* see original task: TVD-1247
	* This logic is only for alert notifications
	*/
	public allowAlertNotificationsSoundOnce(): void {
		this.alertNotifier.allowAlertNotificationsSoundOnce();
	}

	public dispose(): void {
		this.alertNotifier.dispose();
	}
}
