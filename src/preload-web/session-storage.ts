import { ipcRenderer } from 'electron';

import { IPC_SESSION_STORAGE_CHANNEL, isStorageData } from './session-storage-shared';

export type SessionStorageApi = Pick<Storage, 'setItem' | 'getItem' | 'clear' | 'removeItem'> & {
	// Electron snapshots get/set members such as .length during exposeInMainWorld
	// so we have to use actuall fucntion
	getLength(): number;
}

class SessionStorageProxy implements SessionStorageApi {
	#cachedStorage: Map<string, string> | null = null;

	public getLength(): number {
		const cachedStorage = this.ensureLoaded();
		return cachedStorage.size;
	}

	public setItem(key: string, value: string): void {
		const cachedStorage = this.ensureLoaded();
		cachedStorage.set(key, value);
		ipcRenderer.send(IPC_SESSION_STORAGE_CHANNEL.setItem, key, value);
	}

	public getItem(key: string): string | null {
		const cachedStorage = this.ensureLoaded();
		return cachedStorage.get(key) ?? null;
	}

	public removeItem(key: string): void {
		const cachedStorage = this.ensureLoaded();
		cachedStorage.delete(key);

		ipcRenderer.send(IPC_SESSION_STORAGE_CHANNEL.removeItem, key);
	}

	public clear(): void {
		const cachedStorage = this.ensureLoaded();
		cachedStorage.clear();
		ipcRenderer.send(IPC_SESSION_STORAGE_CHANNEL.clear);
	}

	private ensureLoaded(): Map<string, string> {
		if (this.#cachedStorage !== null) {
			return this.#cachedStorage;
		}

		try {
			const data: unknown = ipcRenderer.sendSync(IPC_SESSION_STORAGE_CHANNEL.initCachedStoreSync);
			if (isStorageData(data)) {
				this.#cachedStorage = new Map(data);
				return this.#cachedStorage;
			}
		}
		catch (error) {
			console.log('TVD.sessionStorage cachedStorage init request failed with error: ', error);
		}

		this.#cachedStorage = new Map();
		return this.#cachedStorage;
	}
}

const sessionStorageProxy = new SessionStorageProxy();

export const TvdSessionStorage: SessionStorageApi = {
	getLength: function(): number {
		return sessionStorageProxy.getLength();
	},
	setItem: function(key: unknown, value: unknown): void {
		sessionStorageProxy.setItem(String(key), String(value));
	},
	getItem: function(key: unknown): string | null {
		return sessionStorageProxy.getItem(String(key));
	},
	removeItem: function(key: unknown): void {
		sessionStorageProxy.removeItem(String(key));
	},
	clear: function(): void {
		sessionStorageProxy.clear();
	},
};
