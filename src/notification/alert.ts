import { TvdNotification } from './notification';

export enum AlertNotificationType {
	Fire = 'fire',
	FireControl = 'fire_control',
}

export interface AlertNotification extends TvdNotification {
	type: AlertNotificationType;
	alertId: number;
	soundParams?: SoundParams;
}

export interface SoundParams {
	// duration 0 - play sound once; duration > 0 repeat sound for duration
	duration: number; // in seconds
	name: string;
}

export function isSoundParams(value: unknown): value is SoundParams {
	if (value === null || value === undefined || typeof value !== 'object') {
		return false;
	}

	return (
		'duration' in value &&
		typeof value.duration === 'number' &&
		'name' in value &&
		typeof value.name === 'string'
	);
}

export interface AlertFireNotification extends AlertNotification {
	type: AlertNotificationType.Fire;
	symbol: string;
	chartUrl: string;
	fireId: string;
}

export interface AlertFireControlNotification extends AlertNotification {
	type: AlertNotificationType.FireControl;
}

export function isAlertNotification(notification: TvdNotification): notification is AlertNotification {
	return (
		'type' in notification &&
		(notification.type === AlertNotificationType.Fire || notification.type === AlertNotificationType.FireControl) &&
		'alertId' in notification &&
		typeof notification.alertId === 'number'
	);
}

export function isAlertFireNotification(notification: AlertNotification): notification is AlertFireNotification {
	return (
		notification.type === AlertNotificationType.Fire &&
		'symbol' in notification &&
		typeof notification.symbol === 'string' &&
		'chartUrl' in notification &&
		typeof notification.chartUrl === 'string' &&
		'fireId' in notification &&
		typeof notification.fireId === 'string'
	);
}

export function isAlertFireControlNotification(notification: AlertNotification): notification is AlertFireControlNotification {
	return notification.type === AlertNotificationType.FireControl;
}
