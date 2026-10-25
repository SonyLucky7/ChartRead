import { VIEW_READY_MESSAGE } from '../../tv-api/tvd-channels';

export function waitViewReady(webContents: Electron.WebContents): Promise<void> {
	return new Promise((resolve, reject) => {
		const viewReadyHandler = (ev: Electron.Event, channel: string): void => {
			if (channel !== VIEW_READY_MESSAGE) {
				return;
			}

			webContents.removeListener('ipc-message', viewReadyHandler);
			resolve();
		};

		webContents.once('did-fail-load', () => {
			reject(new Error('Error waitViewReady: did-fail-load'));
		});

		webContents.addListener('ipc-message', viewReadyHandler);
	});
}
