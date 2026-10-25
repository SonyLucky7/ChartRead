import { createHash } from 'crypto';
import { app } from 'electron';
import { createReadStream } from 'fs';
import path from 'path';
import { Subject, Subscription } from 'rxjs';
import { compare, SemVer } from 'semver';
import { ParserOptions, parseStringPromise } from 'xml2js';
import { firstCharLowerCase } from 'xml2js/lib/processors';

import { get, head, HttpResponse, HttpResponseCode } from '../../http';
import { loggerService } from '../../logger';
import { logCall } from '../../logger/log-decorator';
import { applyUpdate, disposeAutoupdater, getUpdateErrors, setErrorHandler } from '../../native';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { captureMessage, SentryMessage } from '../../sentry/main';
import { getMessageOfError } from '../../tvd-runtime/core';
import { extractMd5fromETag, ignorePromise } from '../../utils';
import { getBuildInfo } from '../../utils/build-info';
import { appSettingsService } from '../app-settings-service';
import { getConfiguration } from '../configuration';
import { userService } from '../user';
import { AutoUpdater, UpdateEvent } from './auto-update';
import { AppInstaller, downloadAppinstaller } from './windows-update-downloader';

const maxDownloadAttempts = 3;

interface EventData {
	name: string;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_?: string;
}

interface Event {
	system: {
		keywords?: string;
		correlation?: string;
		execution?: string;
	};
	eventData: {
		data: EventData[];
	};
	xmlns?: string;
}

interface MsixHash {
	md5: Buffer;
	modifiedTime: Date;
}

export class WindowsAutoUpdater implements AutoUpdater {
	private appInstaller?: AppInstaller;
	private userStatusSubscription?: Subscription;

	private updatesCheckTimer?: NodeJS.Timeout;

	private updateDownloadAttempts = 0;
	private readonly msixTargetPath = path.join(FileSystemProvider.getDefaultCriticalAppPathOrThrow('temp'), 'TradingView.msix');
	private downloadedMsixHash?: MsixHash;
	private remoteMsixMd5: Buffer | null = null;

	private readonly updateStatus = new Subject<UpdateEvent>();
	public readonly updateStatusChange = this.updateStatus.asObservable();

	private xmlParserOptions: ParserOptions = {
		trim: true,
		normalize: true,
		explicitRoot: false,
		mergeAttrs: true,
		explicitArray: false,
		attrNameProcessors: [firstCharLowerCase],
		tagNameProcessors: [firstCharLowerCase],
	};

	constructor() {
		this.userStatusSubscription = userService().userSignedIn.subscribe(() => ignorePromise(this.processErrorEvents()));

		setErrorHandler((errorMessage: string) => {
			loggerService().error(errorMessage);
			this.updateStatus.next({ type: 'error', errorMessage });
			disposeAutoupdater();
			app.relaunch();
			app.quit();
		});
	}

	async downloadUpdate(): Promise<void> {
		if (!this.appInstaller) {
			return;
		}

		this.updateStatus.next({ type: 'update-downloading' });

		while (true) {
			if (this.updateDownloadAttempts >= maxDownloadAttempts) {
				this.updateStatus.next({ type: 'error', errorMessage: 'Maximum download attempts reached' });

				return;
			}

			if (!this.msixDownloaded()) {
				this.updateDownloadAttempts++;
				await this.downloadMsix();
			}

			try {
				if (await this.isDownloadedMsixValid()) {
					break;
				}
			}
			catch (err) {
				this.updateStatus.next({ type: 'error', errorMessage: getMessageOfError(err) });

				return;
			}

			await FileSystemProvider.deleteAsync(this.msixTargetPath);
		}

		appSettingsService().set('lastUpdateTime', new Date().toISOString());
		this.updateStatus.next({ type: 'update-downloaded' });
	}

	async downloadMsix(): Promise<void> {
		if (!this.appInstaller) {
			return;
		}

		let response: HttpResponse | undefined;

		try {
			response = await get({ url: this.msixUrl() });

			if (!response.data || response.code !== HttpResponseCode.OK) {
				throw new Error('WindowsAutoUpdater.downloadUpdate(): "Could not read msix from remote location"');
			}

			this.remoteMsixMd5 = extractMd5fromETag(response.headers?.etag ?? '');

			await FileSystemProvider.writeFileAsync(this.msixTargetPath, response.data);
		}
		catch (err) {
			this.updateStatus.next({ type: 'error', errorMessage: getMessageOfError(err) });
		}
	}

	@logCall
	async checkForUpdates(): Promise<void> {
		try {
			this.appInstaller = await downloadAppinstaller();
		}
		catch (err) {
			this.updateStatus.next({ type: 'error', errorMessage: getMessageOfError(err) });
		}

		if (!this.appInstaller) {
			return;
		}

		const currentBuildInfo = await getBuildInfo();

		this.setupUpdatesMonitoring();

		loggerService().info(`Actual version is "${ this.appInstaller.version }"`);

		if (this.isNewVersionAvailable(this.appInstaller.version, currentBuildInfo.appVersion)) {
			this.updateStatus.next({ type: 'update-available', data: { newVersion: this.appInstaller.version } });

			return;
		}

		this.updateStatus.next({ type: 'update-not-available' });

		if (this.msixDownloaded()) {
			ignorePromise(FileSystemProvider.deleteAsync(this.msixTargetPath));
		}
	}

	private msixUrl(): string {
		if (!this.appInstaller) {
			throw new Error('Appinstaller must be dowloaded before msix url evaluation');
		}

		const appIntallerUrlString = getConfiguration().update.appInstallerUrl;
		let msixUrl = new URL(this.appInstaller.mainPackage.uri);

		if (appIntallerUrlString) {
			const appIntallerUrl = new URL(appIntallerUrlString);
			msixUrl = new URL(appIntallerUrl);
			msixUrl.pathname = new URL(this.appInstaller.mainPackage.uri).pathname;
		}

		return msixUrl.toString();
	}

	@logCall
	startInstallingUpdate(): void {
		if (!this.msixDownloaded()) {
			return;
		}

		(async(): Promise<void> => {
			if (!await this.isDownloadedMsixValid()) {
				this.updateStatus.next({ type: 'error', errorMessage: 'Msix is not valid' });
				return;
			}

			applyUpdate(this.msixTargetPath);
		})()
			.catch(err => {
				this.updateStatus.next({ type: 'error', errorMessage: getMessageOfError(err) });
			});
	}

	private setupUpdatesMonitoring(): void {
		if (!this.appInstaller) {
			return;
		}

		if (this.updatesCheckTimer) {
			clearInterval(this.updatesCheckTimer);
		}

		const updateCheckInterval =
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			Number.parseInt(this.appInstaller.updateSettings.onLaunch.hoursBetweenUpdateChecks, 10) * 60 * 60 * 1000;

		this.updatesCheckTimer = setInterval(() => {
			ignorePromise(this.checkForUpdates());
		}, updateCheckInterval);
	}

	private isNewVersionAvailable(incomingVersion: string, currentVersion: string): boolean {
		const incomingSemverVersion = incomingVersion.substring(0, incomingVersion.lastIndexOf('.'));

		return new SemVer(incomingSemverVersion).compareMain(currentVersion) > 0;
	}

	private async processErrorEvents(): Promise<void> {
		const updatedSuccessfully = await this.resetFailsCountIfNeed();

		const lastUpdateTime = appSettingsService().get('lastUpdateTime');

		if (!lastUpdateTime) {
			return;
		}

		if (!this.canSendErrors()) {
			return;
		}

		appSettingsService().set('lastUpdateTime', undefined);
		const events = getUpdateErrors(this.updateErrorsFilter(lastUpdateTime)).filter(event => event.toLowerCase().includes('tradingview'));

		if (events.length === 0) {
			return;
		}

		if (updatedSuccessfully) {
			return;
		}

		const filterByCallingProcessAndErrorCode = (data: EventData[]): boolean => {
			for (const element of data) {
				// filter errors from system updater
				if (element.name === 'CallingProcess' && element?._ === 'svchost.exe,AppXSvc') {
					return true;
				}

				// filter "app need to be closed" error
				if (element.name === 'ErrorCode' && element?._ === '0x80073d02') {
					return true;
				}
			}

			return false;
		};

		const sentryMessage: SentryMessage = {
			title: 'WindowsUpdateFailed',
			level: 'warning',
			breadcrumbs: [],
		};

		for (const event of events) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			const xmlObject = (await parseStringPromise(event, this.xmlParserOptions)) as Event;
			if (filterByCallingProcessAndErrorCode(xmlObject.eventData.data)) {
				return;
			}

			const eventData = xmlObject.eventData.data.find(element => element.name === 'ErrorCode');
			sentryMessage.code = eventData?._;

			this.removeUnnecessaryInfo(xmlObject);
			sentryMessage.breadcrumbs.push(JSON.stringify(xmlObject, null, '\t'));
		}

		const failsCount = appSettingsService().get('updateFailsCount');
		appSettingsService().set('updateFailsCount', failsCount + 1);

		captureMessage(sentryMessage);
	}

	private updateErrorsFilter(dateTime: string): string {
		return `<QueryList>
					<Query Id='0' Path='Microsoft-Windows-AppXDeploymentServer/Operational'>
						<Select Path='Microsoft-Windows-AppXDeploymentServer/Operational'>*[System[(Level=2) and TimeCreated[@SystemTime&gt;='${ dateTime }']]]</Select>
					</Query>
				</QueryList>`;
	}

	// Removing the fields that we absolutely sure don't need, and resting other which names we dont know
	private removeUnnecessaryInfo(event: Event): void {
		delete event.xmlns;
		delete event.system.keywords;
		delete event.system.correlation;
		delete event.system.execution;
	}

	private async resetFailsCountIfNeed(): Promise<boolean> {
		const versionAtLastStart = appSettingsService().get('lastStartVersion');
		const currentBuildInfo = await getBuildInfo();

		let updated = false;

		if (!versionAtLastStart) {
			appSettingsService().set('lastStartVersion', currentBuildInfo.appVersion);
			return updated;
		}

		if (compare(versionAtLastStart, currentBuildInfo.appVersion) < 0) {
			appSettingsService().set('updateFailsCount', 0);
			updated = true;
		}

		appSettingsService().set('lastStartVersion', currentBuildInfo.appVersion);
		return updated;
	}

	private canSendErrors(): boolean {
		const maxFails = 3;
		const failsCount = appSettingsService().get('updateFailsCount');

		return failsCount < maxFails;
	}

	private async updateDownloadedMsixHash(): Promise<void> {
		if (!this.msixDownloaded()) {
			this.downloadedMsixHash = undefined;
			return;
		}

		let msixStats = await FileSystemProvider.fileStats(this.msixTargetPath);

		if (this.downloadedMsixHash?.modifiedTime.getTime() === msixStats.mtime.getTime()) {
			return;
		}

		const md5 = await this.md5FileChecksum(this.msixTargetPath);
		msixStats = await FileSystemProvider.fileStats(this.msixTargetPath);

		this.downloadedMsixHash = {
			md5,
			modifiedTime: msixStats.mtime,
		};
	}

	private md5FileChecksum(filePath: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const hash = createHash('md5');
			createReadStream(filePath)
				.once('end', () => resolve(hash.digest()))
				.once('error', () => reject)
				.pipe(hash);
		});
	}

	private msixDownloaded(): boolean {
		return FileSystemProvider.exists(this.msixTargetPath);
	}

	private async getRemoteMsixMd5(): Promise<Buffer | null> {
		if (this.remoteMsixMd5) {
			return this.remoteMsixMd5;
		}

		const etag = (await head({ url: this.msixUrl() })).headers?.etag;

		if (!etag) {
			return null;
		}

		const md5 = extractMd5fromETag(etag);

		this.remoteMsixMd5 = md5;

		return this.remoteMsixMd5;
	}

	private async isDownloadedMsixValid(): Promise<boolean> {
		await this.updateDownloadedMsixHash();
		const remoteMsixMd5 = await this.getRemoteMsixMd5();

		if (!remoteMsixMd5) {
			loggerService().warn('Remote Msix ETag does not exists or is not md5 hash. Skip checking and accept package');
			return true;
		}

		return Boolean(this.downloadedMsixHash && remoteMsixMd5.equals(this.downloadedMsixHash.md5));
	}

	dispose(): void {
		this.userStatusSubscription?.unsubscribe();
		disposeAutoupdater();

		if (this.updatesCheckTimer) {
			clearInterval(this.updatesCheckTimer);
		}
	}
}
