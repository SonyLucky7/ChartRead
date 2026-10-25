import { NotificationService } from './notification-service';
export { TvdNotification, isTvdNotification } from './notification';
export { AlertFireNotification, AlertFireControlNotification } from './alert';

let notificationServiceInstance: NotificationService | null = null;

export function notificationService(): NotificationService {
	if (notificationServiceInstance === null) {
		notificationServiceInstance = new NotificationService();
	}

	return notificationServiceInstance;
}
