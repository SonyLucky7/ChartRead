import { BrowserWindow } from 'electron';
import { BehaviorSubject } from 'rxjs';

import { loggerService } from '../../logger';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { RendererWorker } from '../renderer-worker';
let dragServiceWnd: BrowserWindow | undefined;

let serviceReady = false;

export const dragServiceReady = new BehaviorSubject<boolean>(false);

export function configureDragService(): void {
	if (serviceReady) {
		return;
	}

	const onLoad = (): void => {
		if (!dragServiceWnd) {
			return;
		}

		serviceReady = true;
		loggerService().debug('Drag service window finished load');
		dragServiceReady.next(true);
	};

	if (!dragServiceWnd) {
		dragServiceWnd = RendererWorker
			.createRendererWorkerWindow(FileSystemProvider.makeAppRootPath('app/renderer-services/drag-service/index.html'), onLoad);
	}
}

export function isDragServiceReady(): boolean {
	return serviceReady;
}

export async function disposeDragService(): Promise<void> {
	loggerService().debug('Drag service dispose');
	return new Promise((resolve) => {
		if (!dragServiceWnd || dragServiceWnd.isDestroyed()) {
			resolve();
			return;
		}

		dragServiceWnd.on('closed', () => resolve());

		dragServiceWnd.close();
		serviceReady = false;
	});
}
