import { WebContents } from 'electron';

import { loggerService } from '../../logger';
import { IPC_SESSION_STORAGE_CHANNEL, StorageData } from '../../preload-web/session-storage-shared';
import { SessionStorageBackend } from './backends';

function getOrigin(rawUrl: string): string | null {
	try {
		const url = new URL(rawUrl);
		return url.origin;
	}
	catch {
		loggerService().error('TabSessionStorage: error while parsing url to get origin');
	}
	return null;
}

interface CachedStorage {
	origin: string;
	storage: Map<string, string>;
}

export class TabSessionStorage {
	private cachedStorage: CachedStorage | null = null;
	constructor(private tabId: string, private store: SessionStorageBackend) {}

	public setupSessionStorageApi(webContents: WebContents): void {
		webContents.ipc
			.on(IPC_SESSION_STORAGE_CHANNEL.initCachedStoreSync, (event) => {
				event.returnValue = this.getStorageCachedData(event.sender.getURL());
			})
			.on(IPC_SESSION_STORAGE_CHANNEL.setItem, (event, key, value) => {
				this.setItem(event.sender.getURL(), key as string, value as string);
			})
			.on(IPC_SESSION_STORAGE_CHANNEL.removeItem, (event, key) => {
				this.removeItem(event.sender.getURL(), key as string);
			})
			.on(IPC_SESSION_STORAGE_CHANNEL.clear, (event) => {
				this.clear(event.sender.getURL());
			});
	}

	public async initStorageCache(url: string): Promise<void> {
		const origin = getOrigin(url);
		if (origin === null) {
			return;
		}

		const data = await this.store.getSessionData(this.tabId, origin);
		this.resetCache(origin, data);
	}

	private getStorageCachedData(url: string): StorageData {
		const origin = getOrigin(url);
		if (origin === null) {
			return [];
		}

		const cache = this.getCachedStorage(origin);
		if (cache === null) {
			return [];
		}

		return Array.from(cache);
	}

	private setItem(url: string, key: string, value: string): void {
		const origin = getOrigin(url);

		if (origin === null) {
			return;
		}
		this.store.setItem(this.tabId, origin, key, value);

		this.getCachedStorage(origin)?.set(key, value);
	}

	private removeItem(url: string, key: string): void {
		const origin = getOrigin(url);
		if (origin === null) {
			return;
		}

		this.store.removeItem(this.tabId, origin, key);
		this.getCachedStorage(origin)?.delete(key);
	}

	private clear(url: string): void {
		const origin = getOrigin(url);
		if (origin === null) {
			return;
		}

		this.store.clearItems(this.tabId, origin);
		this.getCachedStorage(origin)?.clear();
	}

	private getCachedStorage(origin: string): Map<string, string> | null {
		if (this.cachedStorage === null || this.cachedStorage.origin !== origin) {
			loggerService().error(
				`SessionStorageAgent: attempt to get cached storage for uninitialized origin.
				Cache prepared for ${ this.cachedStorage?.origin }(null - not prepared at all), but requested for ${ origin }`);
			return null;
		}

		return this.cachedStorage.storage;
	}

	private resetCache(origin: string, storageData: StorageData): void {
		this.cachedStorage = { origin, storage: new Map(storageData) };
	}
}
