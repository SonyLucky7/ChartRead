import * as path from 'path';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { loggerService } from '../logger';
import { logCall, logCallName } from '../logger/log-decorator';
import { sessionStorageService } from '../main/session-storage';
import { performanceService } from '../performance';
import { FileSystemProvider, getTvUserFolderPath } from '../providers/file-system-provider';
import { appSettingsService } from '../services/app-settings-service';
import { getConfiguration } from '../services/configuration';
import { createFileStorage, IStorage } from '../services/storage';
import { trackEventService } from '../services/track-event-service';
import { userService } from '../services/user';
import { TabbedWindowState } from '../services/window/tabbed-window';
import { AppStateInner } from '../services/window/window-service';
import { IPersistentCompoundObject, PersistentCompoundObject } from '../tvd-runtime/core/persistence/persistence';
import { ignorePromise } from '../utils';
import { jsonParse } from '../utils/json-parse';
import { IPersistenceService } from './ipersistence-service';

type State = {
	app: {
		chartWindows: TabbedWindowState[];
		state: AppStateInner;
	};
};

const APP_USERS_STORAGE_PATH = FileSystemProvider.getAppUserStorageFolderPath();

function getUserSettingsFilePath(userId: string): string {
	const SETTINGS_FILE_NAME = 'settings.json';
	return path.join(getTvUserFolderPath(userId), SETTINGS_FILE_NAME);
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PersistenceRoot extends IPersistentCompoundObject { }

@PersistentCompoundObject
class PersistenceRoot { }

@logCallName('PersistenceService')
export class PersistenceService implements IPersistenceService {
	private readonly stateRestoredSubject = new Subject<void>();
	private storage: IStorage | null = null;
	private readonly root = new PersistenceRoot();
	private readonly storeDelay: number;
	private storeOperation: Promise<void> | null = null;

	private rootChangeSubscription?: Subscription;

	readonly stateRestored = this.stateRestoredSubject.asObservable();

	constructor() {
		loggerService().debug('Initializing PersistenceService');

		this.storeDelay = getConfiguration().persistence.autoSaveInterval;

		userService().prepareUserSignOut.subscribe(signOutData => {
			const work = (async(): Promise<void> => {
				this.rootChangeSubscription?.unsubscribe();

				if (this.storeOperation) {
					await this.storeOperation;
				}
				else {
					await this.store();
				}

				if (this.storage) {
					this.storage.dispose();
					this.storage = null;
				}
			})();

			signOutData.workAcceptor(work);
		});

		userService().userSignedIn.subscribe(signInData => {
			ignorePromise(this.handleAppAttemptStatus());

			const ev = performanceService().beginEvent('Restore user session');

			const settingsPath = getUserSettingsFilePath(signInData.user.id);
			loggerService().info(`Restore user app state from '${ settingsPath }'`);
			this.storage = createFileStorage(settingsPath);

			this
				.restore()
				.then(() => {
					performanceService().endEvent(ev);

					trackEventService().trackStartApp();
				})
				.catch((error: unknown) => {
					loggerService().error('[PersistenceService()] Error at restore state on user sign in', error);
				});

			this.rootChangeSubscription = this.root.changed
				.pipe(debounceTime(this.storeDelay))
				.subscribe(() => {
					if (!this.storage) {
						return;
					}

					ignorePromise(this.store());
				});
		});
	}

	get persistentRoot(): IPersistentCompoundObject {
		return this.root;
	}

	@logCall
	async restore(): Promise<void> {
		if (!this.storage) {
			loggerService().error('State restore can not be performed - storage is not assigned, possible no signed-in user');
			return;
		}
		// wait for sessionStorage here bc this is the only place to wait
		// before windows/tabs creation for signed-in user
		// windows and tab creation goes from inside this.root.applyState();
		await sessionStorageService().ready();

		try {
			const json = await this.storage.restore();
			if (typeof json !== 'string') {
				throw new Error('json is not a string');
			}

			if (json === '') {
				throw new Error('json is empty');
			}

			const state: unknown = jsonParse(json);
			const operation = this.root.applyState(state);
			if (operation instanceof Promise) {
				await operation;
			}
		}
		catch (error) {
			loggerService().error('Failed to restore app state', error);
		}

		// Temporary fix due to problems with Feature toggle service
		// trackWindowsData triggers extractState, including Linker extract state
		// which in turn uses Feature Service to check for new_linking feature.
		// Unfortunately Feature Service gives invalid state at application startup.
		// This is least invasive workaround, especially since WindowData is not critical to track as of right now.
		// The Feature Service fix/rework is planned in https://jira.xtools.tv/browse/TVD-2678
		//
		// The way trackWindowData works is also a bit problematic within itself.
		// As in order to get windows and tabs count it requests extractState for the whole persistency Root,
		// triggering data extraction for all the component and services not related to windows and tabs.
		// Reconsideration for windows and tabs count Analytics tracking is planned in https://jira.xtools.tv/browse/TVD-2684
		// This commend will be removed when either of the above issues are resolved.
		// this.trackWindowsData();

		this.stateRestoredSubject.next();
	}

	@logCall
	store(): Promise<void> {
		if (!this.storage) {
			loggerService().error('Store state can not be performed - storage is not assigned, possible no signed-in user');
			return Promise.reject(new Error('Storage not initialize'));
		}
		const jsonState = this.getCurrentState();

		this.trackWindowsData();

		return this.storage.store(jsonState);
	}

	@logCall
	async clearUserStorage(): Promise<void> {
		// sessionStorageService user storage lives in app user storage folder
		// therefore we need to deinitialize it before clear
		await sessionStorageService().shutdownUserStorage();
		if (FileSystemProvider.exists(APP_USERS_STORAGE_PATH)) {
			FileSystemProvider.deleteDir(APP_USERS_STORAGE_PATH, { recursive: true });
		}

		return Promise.resolve();
	}

	getCurrentState(): string {
		const state: unknown = this.persistentRoot.extractState();
		return JSON.stringify(state, undefined, 2);
	}

	@logCall
	checkUserStorageExistence(): Promise<boolean> {
		return Promise.resolve(FileSystemProvider.exists(APP_USERS_STORAGE_PATH));
	}

	dispose(): void {
		this.storage?.dispose();
		this.storage = null;
		this.rootChangeSubscription?.unsubscribe();
	}

	private trackWindowsData(): void {
		const appState = (this.persistentRoot.extractState() as State).app;

		const chartWindows = appState?.chartWindows;

		if (!chartWindows) {
			return;
		}

		const tabsCount = chartWindows.reduce((acc, currentValue) => acc + currentValue.tabs.length, 0);

		trackEventService().setAppWindowsData(
			chartWindows.length === 0 ? 1 : chartWindows.length,
			tabsCount === 0 ? 1 : tabsCount
		);
	}

	private async handleAppAttemptStatus(): Promise<void> {
		const isUserStorageExist = await this.checkUserStorageExistence();

		appSettingsService().set('isFirstSuccessfullAuthAttempt', !isUserStorageExist);
	}
}
