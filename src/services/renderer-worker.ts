import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { enable } from '@electron/remote/main';

import { logCall, logCallName } from '../logger/log-decorator';
import { ignorePromise } from '../utils';
import { mainService } from './main-service';
import { StatefulWindow } from './window/stateful-window';

@logCallName('RendererWorker')
export class RendererWorker extends StatefulWindow {
	private onLoad?: () => void;

	@logCall
	public static createRendererWorkerWindow(url: string, onLoad?: () => void): BrowserWindow {
		const wnd = new RendererWorker({
			focusable: false,
			show: false,
			webPreferences: {
				devTools: mainService().isDebugMode(),
				contextIsolation: false,
				nodeIntegration: true,
				backgroundThrottling: false,
			},
		}, url);

		wnd.onLoad = onLoad;

		ignorePromise(wnd.load());

		enable(wnd.windowRef.webContents);

		return wnd.windowRef;
	}

	constructor(options: BrowserWindowConstructorOptions, url: string) {
		super(options, url);
	}

	override onStartLoad(): void {
		this.createAppAwaiter();
	}

	override onFinishLoad(): void {
		if (this.onLoad) {
			this.onLoad();
		}
	}
}
