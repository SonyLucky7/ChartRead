import { BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main';

import { Promisify } from '../ipc-remote';
import { IpcServices } from '../ipc-services';
import { loggerService } from '../logger';
import { FileSystemProvider } from '../providers/file-system-provider';
import { windowService } from './window';
import { TabTitle } from './window/window-api';

const TAB_MONITORING_CONTRACT = 'tvd:tab-monitoring-contract';

export interface TabStatusData {
	id: string;
	pid: number | null;
	status: string;
	title: string;
}

interface ITabMonitoringService {
	getTabStatus(): Promise<TabStatusData[]>;
	freezeTabById(tabId: string): Promise<void>;
}

export function tabMonitoringServiceProxy(): Promisify<ITabMonitoringService> {
	return IpcServices.provideProxy<ITabMonitoringService>(TAB_MONITORING_CONTRACT);
}

function registerTabMonitoringService(): void {
	IpcServices.getProvider().registerFactory(TAB_MONITORING_CONTRACT, () => new TabMonitoringService());
}

export async function createTabMonitorView(): Promise<void> {
	try {
		registerTabMonitoringService();
	}
	catch (error) {
		loggerService().error('createTabMonitorView(): register TabMonitoringService', error);
	}

	const wnd = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			devTools: true,
		},
	});

	enable(wnd.webContents);
	await wnd.loadFile(FileSystemProvider.makeAppRootPath('/app/tab-monitor/index.html'));
}

class TabMonitoringService implements ITabMonitoringService {
	public async getTabStatus(): Promise<TabStatusData[]> {
		const result: TabStatusData[] = await Promise.all(
			windowService().getAllTabs()
				.map(async tab => ({ id: tab.id, pid: tab.pid, status: await tab.getVisibleStatus(), title: getTitleString(tab.title) }))
		);

		return result;
	}

	public async freezeTabById(tabId: string): Promise<void> {
		loggerService().warn(`TabMonitoringService.freezeTabById(): ${ tabId }`);

		const tab = windowService().getAllTabs().find(t => t.id === tabId);

		if (tab === undefined) {
			loggerService().warn(`TabMonitoringService.freezeTabById(): Tab with id ${ tabId } not found`);
			return;
		}

		await tab.freeze();
	}
}

function getTitleString(tabTitle: TabTitle): string {
	if (typeof tabTitle === 'string') {
		return tabTitle;
	}

	return `${ tabTitle.layout } ${ tabTitle.name } ${ tabTitle.symbol }`;
}
