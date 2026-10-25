import { Event, ipcMain, IpcMainEvent } from 'electron';

import { IpcMessage } from '../../ipc-core';
import { IpcChannels, PortResponseBody } from '../../ipc-protocol';
import { BaseIpcInbox } from './base-ipc-inbox';

export class MainIpcInbox extends BaseIpcInbox {
	onMessage(channel: string, handler: (ev: Event, msg: IpcMessage) => void): void {
		ipcMain.on(channel, handler);
	}

	makeResponseChannel(ev: Event): (msg: IpcMessage) => void {
		return function(msg: IpcMessage): void {
			const sender = (ev as IpcMainEvent).sender;
			if (sender.isDestroyed()) {
				console.debug('Response will not be send to the destroyed contents');
				return;
			}

			const body = msg.body as PortResponseBody;
			if (body.port) {
				msg.body = {};
				sender.postMessage(IpcChannels.RESPONSE_CHANNEL, msg, [body.port]);
				return;
			}
			sender.postMessage(IpcChannels.RESPONSE_CHANNEL, msg);
		};
	}
}
