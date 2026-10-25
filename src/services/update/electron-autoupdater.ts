import { app } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import fs from 'fs';
import i18next from 'i18next';
import jsyaml from 'js-yaml';
import os from 'os';
import path from 'path';
import { Subject } from 'rxjs';
import semver from 'semver';

import { get, HttpResponseCode } from '../../http';
import { loggerService } from '../../logger';
import { ignorePromise } from '../../utils/async';
import { safeJsonParse } from '../../utils/json-parse';
import { getConfiguration } from '../configuration';
import { AutoUpdater, UpdateEvent } from './auto-update';

interface ProgressObject {
	bytesPerSecond: number;
	percent: number;
	transferred: number;
	total: number;
}

interface DarwinRequirements {
	minimumSystemVersion: string;
}

interface AppUpdateSourceInfo {
	url: string;
}

function isRequirements(value: unknown): value is DarwinRequirements {
	return value !== null &&
		typeof value === 'object' &&
		'minimumSystemVersion' in value &&
		value.minimumSystemVersion !== null &&
		typeof value.minimumSystemVersion === 'string';
}

function isAppUpdateSourceInfo(value: unknown): value is AppUpdateSourceInfo {
	return value !== null &&
		typeof value === 'object' &&
		'url' in value &&
		value.url !== null &&
		typeof value.url === 'string';
}

export class ElectronAutoUpdater implements AutoUpdater {
	private readonly updateStatus = new Subject<UpdateEvent>();
	public readonly updateStatusChange = this.updateStatus.asObservable();

	constructor() {
		autoUpdater.autoDownload = false;
		autoUpdater.forceDevUpdateConfig = getConfiguration().update.forceDevUpdate;

		const ymlConfigPath = getConfiguration().update.appUpdateYmlPath;
		if (ymlConfigPath) {
			autoUpdater.updateConfigPath = ymlConfigPath;
		}

		this.subscribeUpdateEvents();
	}

	private subscribeUpdateEvents(): void {
		autoUpdater.on('error', () => {
			this.updateStatus.next({
				type: 'error',
				errorMessage: i18next.t('Error during the update. Application cannot be updated. Please try again or contact the support team.'),
			});
		});

		autoUpdater.on('update-available', (info: UpdateInfo) => {
			ignorePromise(this.onUpdateAvailable(info));
		});

		autoUpdater.on('update-not-available', () => {
			this.updateStatus.next({ type: 'update-not-available' });
		});

		autoUpdater.on('update-downloaded', () => {
			this.updateStatus.next({ type: 'update-downloaded' });
		});

		autoUpdater.on('download-progress', (progressObj: ProgressObject) => {
			const downloadSpeed = `Download speed - ${ progressObj.bytesPerSecond }`;
			const downloaded = `Downloaded - ${ Math.round(progressObj.percent) } %`;
			const downloadTransferData = `${ progressObj.transferred } / ${ progressObj.total }`;
			loggerService().info(`AutoUpdateService(): download in progress \n ${ downloadSpeed } \n ${ downloaded } \n ${ downloadTransferData }`);

			this.updateStatus.next({ type: 'update-downloading' });
		});
	}

	async checkForUpdates(): Promise<void> {
		await autoUpdater.checkForUpdates();
	}

	async downloadUpdate(): Promise<void> {
		await autoUpdater.downloadUpdate();
	}

	startInstallingUpdate(): void {
		autoUpdater.quitAndInstall();
	}

	async onUpdateAvailable(info: UpdateInfo): Promise<void> {
		try {
			const response = await get({ url: this.getRestrictionsUrl().toString() });

			if (!response.data || response.code !== HttpResponseCode.OK) {
				this.updateStatus.next({ type: 'update-available', data: { newVersion: info.version } });
				return;
			}

			const updateRequirements = safeJsonParse(isRequirements)(response.data.toString());

			if (!updateRequirements) {
				this.updateStatus.next({ type: 'update-available', data: { newVersion: info.version } });
				return;
			}

			if (semver.compare(updateRequirements.minimumSystemVersion, os.release()) > 0) {
				this.updateStatus.next({
					type: 'dont-meet-system-requirements',
					data: {
						requiredDarwinVersion: updateRequirements.minimumSystemVersion,
						currentDarwinVersion: os.release(),
					},
				});
				return;
			}
		}
		catch (err) {
			loggerService().error('Error occured while loading update restriction.', err);
		}

		this.updateStatus.next({ type: 'update-available', data: { newVersion: info.version } });
	}

	private getRestrictionsUrl(): URL {
		return new URL('requirements.json', this.getAppUpdateYml().url);
	}

	private getAppUpdateYml(): AppUpdateSourceInfo {
		let ymlConfigPath = getConfiguration().update.appUpdateYmlPath;

		if (!ymlConfigPath) {
			ymlConfigPath = app.isPackaged
				? path.join(process.resourcesPath, 'app-update.yml')
				: path.join(app.getAppPath(), 'dev-app-update.yml');
		}

		const parsedYaml = jsyaml.load(fs.readFileSync(ymlConfigPath, 'utf-8'));

		if (!isAppUpdateSourceInfo(parsedYaml)) {
			throw new Error('app-update.yml is malformed');
		}

		return parsedYaml;
	}

	dispose(): void {
	}
}
