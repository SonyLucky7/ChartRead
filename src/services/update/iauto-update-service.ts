import { Observable } from 'rxjs';

import { Disposable } from '../../tvd-runtime/core';

export const AUTO_UPDATE_SERVICE_CONTRACT = 'tvd:auto-update-service';

export interface IAutoUpdateService extends Disposable {
	statusChange: Observable<UpdateStatus>;
	getStatus(): UpdateStatus;
	checkForUpdates(): void;
	startInstallingUpdate(): void;
}

export enum UpdateStatus {
	UpToDate = 'up-to-date',
	Checking = 'checking',
	Downloading = 'downloading',
	ReadyToInstall = 'ready-to-install',
	SystemRequirementsUnmet = 'system-requirements-unmet',
	Installing = 'installing',
	Error = 'error',
}
