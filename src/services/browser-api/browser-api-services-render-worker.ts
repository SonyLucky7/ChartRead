import { BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main';

import { FileSystemProvider } from '../../providers/file-system-provider';
import { Disposable } from '../../tvd-runtime/core';
import { RendererWorker } from '../renderer-worker';

export class BrowserApiServicesRenderWorker implements Disposable {
	private hostWindow: BrowserWindow;

	static async create(): Promise<BrowserApiServicesRenderWorker> {
		let onLoad: (value: void | PromiseLike<void>) => void = () => {};

		const renderWorkerReady = new Promise((resolve) => {
			onLoad = resolve;
		});

		const renderWorker = new BrowserApiServicesRenderWorker(onLoad);

		await renderWorkerReady;

		return renderWorker;
	}

	private constructor(onLoad: () => void) {
		const url = FileSystemProvider.makeAppRootPath('/app/browser-api-container/index.html');

		this.hostWindow = RendererWorker.createRendererWorkerWindow(url, onLoad);

		enable(this.hostWindow.webContents);
	}

	dispose(): void {
		this.hostWindow.close();
	}
}
