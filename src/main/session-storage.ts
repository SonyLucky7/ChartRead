import { ipcMain } from 'electron';
import { Subscription } from 'rxjs';

import { IPC_SESSION_STORAGE_CHANNEL } from '../preload-web/session-storage-shared';
import { userService } from '../services/user';
import { createOnDiskBackendForUser, InMemoryBackend, OnDiskBackend, SessionStorageBackend } from './session-storage/backends';

export { TabSessionStorage } from './session-storage/tab';

interface UserStorage {
	userId: string;
	storage: OnDiskBackend;
}

interface PendingInitForUser {
	userId: string;
	promise: Promise<void>;
}

export class SessionStorageService {
	private anonymousStorage: SessionStorageBackend = new InMemoryBackend();
	private userStorage: UserStorage | null = null;
	private pendingInitForUser: PendingInitForUser | null = null;
	private subscriptions: Array<Subscription> = [];

	constructor() {
		this.initUserServiceSubscriptions();
		this.initSafetyNetIpcHandler();
	}

	public async ready(): Promise<void> {
		const user = userService().getCurrentUser();
		if (user.isAnonymous) {
			return Promise.resolve();
		}
		return this.initUserStorage(String(user.id));
	}

	public getStorage(): SessionStorageBackend {
		if (this.userStorage !== null) {
			return this.userStorage.storage;
		}
		return this.anonymousStorage;
	}

	public keepSessionsDuringFullCleanup(keepIds: Array<string>): void {
		this.userStorage?.storage.keepSessionsDuringFullCleanup(keepIds);
	}

	public scheduleFullCleanupAtDispose(): void {
		this.userStorage?.storage.scheduleFullCleanupAtDispose();
	}

	public async shutdownUserStorage(): Promise<void> {
		if (this.pendingInitForUser !== null) {
			await this.pendingInitForUser.promise;
		}

		await this.userStorage?.storage.dispose();
		this.userStorage = null;
		return;
	}

	public async dispose(): Promise<void> {
		for (const subscription of this.subscriptions) {
			subscription.unsubscribe();
		}
		await this.shutdownUserStorage();
	}

	private initUserServiceSubscriptions(): void {
		const signInSubscription = userService().userSignedIn.subscribe(signInData => {
			// TODO: user.id is not a string even though it says it is, needs fix in userService;
			const userId = String(signInData.user.id);
			this.initUserStorage(userId);
		});
		this.subscriptions.push(signInSubscription);

		const signOutSubscription = userService().prepareUserSignOut.subscribe((signOutData) => {
			const work = (async(): Promise<void> => {
				await this.shutdownUserStorage();
			})();

			signOutData.workAcceptor(work);
		});
		this.subscriptions.push(signOutSubscription);
	}

	private initSafetyNetIpcHandler(): void {
		// WebContents.ipc.on is prioritized by Electron and if registered will always
		// reply to syncSend first, in which case here event.returnValue will be noop.
		// So this is a precaution for the case if per Tab handler is not registered
		// we don't at least block Renderer process.
		ipcMain.on(IPC_SESSION_STORAGE_CHANNEL.initCachedStoreSync, (event) => {
			event.returnValue = [];
		});
	}

	private async initUserStorage(userId: string): Promise<void> {
		if (this.userStorage !== null && this.userStorage.userId === userId) {
			return;
		}

		if (this.pendingInitForUser !== null) {
			if (this.pendingInitForUser.userId === userId) {
				return await this.pendingInitForUser.promise;
			}

			await this.pendingInitForUser.promise;

			if (this.userStorage !== null && this.userStorage.userId === userId) {
				return;
			}
		}

		this.pendingInitForUser = {
			promise: (async(): Promise<void> => {
				const store = await createOnDiskBackendForUser(userId);
				if (store !== null) {
					await this.userStorage?.storage.dispose();
					this.userStorage = { userId, storage: store };
				}
			})(),
			userId,
		};

		try {
			await this.pendingInitForUser.promise;
		}
		finally {
			this.pendingInitForUser = null;
		}
	}
}

let sessionStorageService_: SessionStorageService | undefined;

export function sessionStorageService(): SessionStorageService {
	if (!sessionStorageService_) {
		sessionStorageService_ = new SessionStorageService();
	}

	return sessionStorageService_;
}
