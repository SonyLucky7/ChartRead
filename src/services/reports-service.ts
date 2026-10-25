import { create } from 'archiver';
import * as si from 'systeminformation';

import { loggerService } from '../logger';
import { logCall, logCallName } from '../logger/log-decorator';
import { persistenceService } from '../persistence';
import { sleep } from '../utils';
import { appSettingsService } from './app-settings-service';
import { IReportsService, Report } from './interfaces';
import { mainService } from './main-service';
import { windowService } from './window';

interface CountersData {
	loadStats: si.Systeminformation.CurrentLoadData;
	memoryStats: si.Systeminformation.MemData;
	networkStats: si.Systeminformation.NetworkStatsData[];
	processStats: si.Systeminformation.ProcessesProcessLoadData[];
	electronStats: ElectronStats;
}

interface ElectronStats {
	cpu: Electron.CPUUsage;
	heapStats: Electron.HeapStatistics;
	blinkMemInfo: Electron.BlinkMemoryInfo;
	procMemInfo: Electron.ProcessMemoryInfo;
	rendererReports: unknown;
}

type ReportName = 'sysInfo' | 'counters' | 'logs' | 'settings' | 'appSettings';

@logCallName('ReportsService')
export class ReportsService implements IReportsService {
	private sysInfoData: string | undefined;
	private readonly reportCollectTimeout = 1000;

	// eslint-disable-next-line @typescript-eslint/no-extra-parens, func-call-spacing
	private readonly reportNameToGetter = new Map<ReportName, () => Promise<Report>>([
		['sysInfo', () => this.getSysInfo()],
		['counters', () => this.getCounters()],
		['logs', () => this.getLogs()],
		['settings', () => this.getUserSettings()],
		['appSettings', () => this.getAppSettings()],
	]);

	@logCall
	async getSupportAttachments(): Promise<Report[]> {
		return this.reportsFactory('sysInfo', 'counters', 'logs', 'settings', 'appSettings');
	}

	@logCall
	async getSentryAttachmentsZip(): Promise<Buffer> {
		return this.zippedReportsFactory('logs', 'settings', 'appSettings');
	}

	@logCall
	private async reportsFactory(...neededReports: ReportName[]): Promise<Report[]> {
		const reports: Report[] = [];
		const reportsPromises: Promise<Report>[] = [];

		neededReports.forEach(reportName => {
			const getter = this.reportNameToGetter.get(reportName);

			if (getter) {
				reportsPromises.push(getter());
			}
		});

		reports.push(...await Promise.all(reportsPromises));

		return reports;
	}

	private async zippedReportsFactory(...neededReports: ReportName[]): Promise<Buffer> {
		const reports = await this.reportsFactory(...neededReports);

		const archive = create('zip');
		let dataBuffer = Buffer.from('');

		const createZipFile = new Promise<Buffer>((resolve, reject) => {
			archive.on('warning', (err) => {
				loggerService().error('Error while getting log files', err);
			});

			archive.on('data', (data: Buffer) => {
				dataBuffer = Buffer.concat([dataBuffer, data]);
			});

			archive.on('finish', () => {
				resolve(dataBuffer);
			});

			archive.on('error', (err) => {
				reject(err);
			});

			for (const report of reports) {
				archive.append(report.content, { name: `${ report.name }.json` });
			}

			void archive.finalize();
		});

		return createZipFile;
	}

	@logCall
	private async getCounters(): Promise<Report> {
		const counters: CountersData = {
			loadStats: await this.getCurrentLoad(),
			memoryStats: await this.getMemoryStats(),
			networkStats: await this.getNetworkStats(),
			processStats: await this.getCurrentProcessStats(),
			electronStats: await this.getElectronProcessStats(),
		};

		return { name: 'counters', content: JSON.stringify(counters, null, 2) };
	}

	@logCall
	private async getLogs(): Promise<Report> {
		try {
			const content = await loggerService().getLatestLogs();
			return { name: 'logs', content };
		}
		catch (err) {
			loggerService().error('[ReportsService.getLogs()] Failed to read log files', err);
		}

		return { name: 'logs', content: '' };
	}

	@logCall
	private async getSysInfo(): Promise<Report> {
		if (this.sysInfoData) {
			return { name: 'sysInfo', content: this.sysInfoData };
		}

		const sysObject = {
			system: 'manufacturer, model, version, virtual',
			bios: 'vendor, version, releaseDate',
			baseboard: 'manufacturer, model, version',
			chassis: 'manufacturer, model, type, version',
			osInfo: 'platform, distro, release, kernel, arch, build',
			versions: '*',
			cpu: 'manufacturer, brand, vendor, speed, cores, physicalCores',
			graphics: '*',
			memLayout: 'size, type, clockSpeed, manufacturer',
			diskLayout: 'type, name, size',
		};

		const info = await si.get(sysObject) as unknown;

		return { name: 'sysInfo', content: JSON.stringify(info, null, 2) };
	}

	@logCall
	private async getCurrentLoad(): Promise<si.Systeminformation.CurrentLoadData> {
		// according to https://systeminformation.io/processes.html
		// the correct way to calculate the current load is to call the function twice
		let currentLoad = await si.currentLoad();
		await sleep(this.reportCollectTimeout);
		currentLoad = await si.currentLoad();

		return currentLoad;
	}

	@logCall
	private getMemoryStats(): Promise<si.Systeminformation.MemData> {
		return si.mem();
	}

	@logCall
	private async getNetworkStats(): Promise<si.Systeminformation.NetworkStatsData[]> {
		let stats = await si.networkStats();
		await sleep(this.reportCollectTimeout);
		stats = await si.networkStats();

		return stats;
	}

	// current process cpu + mem usage (%)
	@logCall
	private async getCurrentProcessStats(): Promise<si.Systeminformation.ProcessesProcessLoadData[]> {
		const procName = mainService().isDebugMode() ? 'electron' : 'TradingView';

		const procLoad = await si.processLoad(procName);

		return procLoad;
	}

	@logCall
	private async getElectronProcessStats(): Promise<ElectronStats> {
		let cpuUsage = process.getCPUUsage();
		await sleep(this.reportCollectTimeout);
		cpuUsage = process.getCPUUsage();

		const stats: ElectronStats = {
			cpu: cpuUsage,
			blinkMemInfo: process.getBlinkMemoryInfo(),
			procMemInfo: await process.getProcessMemoryInfo(),
			heapStats: process.getHeapStatistics(),
			rendererReports: await windowService().getRendererReports(),
		};

		return stats;
	}

	@logCall
	private getUserSettings(): Promise<Report> {
		return Promise.resolve({ name: 'settings', content: persistenceService().getCurrentState() });
	}

	@logCall
	private getAppSettings(): Promise<Report> {
		const settings = appSettingsService().getSettings();
		return Promise.resolve({ name: 'appSettings', content: JSON.stringify(settings, undefined, 2) });
	}
}

let reportsService__: IReportsService | undefined;

export default function reportsService(): IReportsService {
	if (!reportsService__) {
		reportsService__ = new ReportsService();
	}

	return reportsService__;
}
