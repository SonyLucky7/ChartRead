import { BehaviorSubject, Subscription } from 'rxjs';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { isDarwin, isWin32 } from '../../utils';
import { isMSStore } from '../../utils/application-repository-type';
import { getConfiguration } from '../configuration';
import { mainService } from '../main-service';
import { AutoUpdater, UpdateEvent } from './auto-update';
import { ElectronAutoUpdater } from './electron-autoupdater';
import { AUTO_UPDATE_SERVICE_CONTRACT, IAutoUpdateService, UpdateStatus } from './iauto-update-service';
import { WindowsAutoUpdater } from './windows-autoupdater';

function createAutoUpdaterIfRequired(): AutoUpdater | null {
	if (isDarwin()) {
		return new ElectronAutoUpdater();
	}
	else if (isWin32() && !isMSStore()) {
		return new WindowsAutoUpdater();
	}

	// Linux and Windows Store app gets updates from stores
	return null;
}

@logCallName('AutoUpdateService')
@ExposeSingletonService(AUTO_UPDATE_SERVICE_CONTRACT, IpcServices.getProvider())
export class AutoUpdateService implements IAutoUpdateService {
	private readonly autoUpdater: AutoUpdater | null = null;

	private statusSubscription: Subscription | null = null;

	private readonly status = new BehaviorSubject<UpdateStatus>(UpdateStatus.UpToDate);
	public readonly statusChange = this.status.asObservable();

	private updateAvailable = false;

	constructor() {
		loggerService().info('Initializing AutoUpdateService');

		if (mainService().isDebugMode() && !getConfiguration().update.forceDevUpdate) {
			this.status.next(UpdateStatus.UpToDate);

			loggerService().info('Skipping updated for dev build');

			return;
		}

		this.autoUpdater = createAutoUpdaterIfRequired();

		this.status.next(UpdateStatus.UpToDate);
		this.subscribeToUpdateStatus();
	}

	private subscribeToUpdateStatus(): void {
		if (this.autoUpdater === null) {
			return;
		}

		this.statusSubscription = this.autoUpdater.updateStatusChange.subscribe(this.handleUpdateEvent.bind(this));
	}

	private handleUpdateEvent(ev: UpdateEvent): void {
		switch (ev.type) {
			case 'update-available': {
				this.handleUpdateAvailable(ev);
				break;
			}
			case 'dont-meet-system-requirements': {
				this.handleDontMeetSystemRequirements(ev);
				break;
			}
			case 'update-not-available': {
				this.handleUpdateNotAvailable(ev);
				break;
			}
			case 'update-downloaded': {
				this.handleUpdateDownloaded(ev);
				break;
			}
			case 'update-downloading': {
				this.handleUpdateDownloading(ev);
				break;
			}
			case 'error':
			default: {
				this.handleUpdateError(ev);
				break;
			}
		}
	}

	private handleUpdateAvailable(ev: UpdateEvent): void {
		if (this.autoUpdater === null || ev.type !== 'update-available') {
			return;
		}

		loggerService().info('AutoUpdateService: update-available');

		this.autoUpdater.downloadUpdate()
			.catch((error) => {
				loggerService().error('AutoUpdateService.handleUpdateAvailable(): autoUpdater.downloadUpdate() error', error);
				this.status.next(UpdateStatus.Error);
			});
	}

	private handleDontMeetSystemRequirements(ev: UpdateEvent): void {
		if (ev.type !== 'dont-meet-system-requirements') {
			return;
		}

		loggerService().warn(`AutoUpdateService: your system don't meet minimum requirements:
			Your Darwin version: ${ ev.data.currentDarwinVersion }. Required: ${ ev.data.requiredDarwinVersion } >=`);
		this.status.next(UpdateStatus.SystemRequirementsUnmet);
	}

	private handleUpdateNotAvailable(ev: UpdateEvent): void {
		if (ev.type !== 'update-not-available') {
			return;
		}

		loggerService().info('AutoUpdateService: update-not-available');
		this.status.next(UpdateStatus.UpToDate);
	}

	private handleUpdateDownloaded(ev: UpdateEvent): void {
		if (ev.type !== 'update-downloaded') {
			return;
		}

		loggerService().info('AutoUpdateService: update-downloaded');
		this.status.next(UpdateStatus.ReadyToInstall);

		this.updateAvailable = true;
	}

	private handleUpdateDownloading(ev: UpdateEvent): void {
		if (ev.type !== 'update-downloading') {
			return;
		}

		loggerService().info('AutoUpdateService: Downloading update');
		this.status.next(UpdateStatus.Downloading);
	}

	private handleUpdateError(ev: UpdateEvent): void {
		if (ev.type !== 'error') {
			return;
		}

		loggerService().error(`AutoUpdateService: Error in autoUpdater: ${ ev.errorMessage }`);
		this.status.next(UpdateStatus.Error);
	}

	public getStatus(): UpdateStatus {
		return this.status.value;
	}

	public checkForUpdates(): void {
		if (this.autoUpdater === null) {
			return;
		}

		if (
			this.status.value !== UpdateStatus.UpToDate &&
			this.status.value !== UpdateStatus.ReadyToInstall &&
			this.status.value !== UpdateStatus.Error
		) {
			return;
		}

		loggerService().info('AutoUpdateService: Check for updates');
		this.status.next(UpdateStatus.Checking);

		this.autoUpdater.checkForUpdates()
			.catch((error) => {
				loggerService().error('AutoUpdateService.checkForUpdates(): autoUpdater.checkForUpdates() error', error);
				this.status.next(UpdateStatus.Error);
			});
	}

	@logCall
	public startInstallingUpdate(): void {
		if (this.autoUpdater === null || this.updateAvailable === false) {
			return;
		}

		if (this.status.value !== UpdateStatus.ReadyToInstall) {
			return;
		}

		loggerService().info('AutoUpdateService: installing update');
		this.status.next(UpdateStatus.Installing);

		this.autoUpdater.startInstallingUpdate();
	}

	public dispose(): void {
		if (this.statusSubscription !== null) {
			this.statusSubscription.unsubscribe();
			this.statusSubscription = null;
		}
		this.autoUpdater?.dispose();
	}
}
