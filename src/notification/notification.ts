export interface TvdNotification {
	id: string;
	desktopNotificationTitle: string;
	description: string;
}

export function isTvdNotification(value: unknown): value is TvdNotification {
	if (value === null || value === undefined || typeof value !== 'object') {
		return false;
	}

	return (
		'id' in value &&
		typeof value.id === 'string' &&
		'desktopNotificationTitle' in value &&
		typeof value.desktopNotificationTitle === 'string' &&
		'description' in value &&
		typeof value.description === 'string'
	);
}
