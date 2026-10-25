const CHANNEL_PREFIX = 'tvd:session-storage';

export const IPC_SESSION_STORAGE_CHANNEL = {
	initCachedStoreSync: `${ CHANNEL_PREFIX }:init-cached-store-sync`,
	setItem: `${ CHANNEL_PREFIX }:set-item`,
	clear: `${ CHANNEL_PREFIX }:clear`,
	removeItem: `${ CHANNEL_PREFIX }:remove-item`,
};

export type StorageData = Array<[string, string]>;

export function isStorageData(value: unknown): value is StorageData {
	return Array.isArray(value) && value.every(
		(item) => {
			return Array.isArray(item) &&
					item.length === 2 &&
					typeof item[0] === 'string' &&
					typeof item[1] === 'string';
		}
	);
}
