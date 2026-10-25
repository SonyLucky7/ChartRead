import { ipcRenderer } from 'electron';
import { Observable } from 'rxjs';

import { IpcMessage, IpcRequest, IpcResponse } from '../ipc-core';
import { IpcChannels } from '../ipc-protocol';

export const toMainSender = (message: IpcMessage): void => { ipcRenderer.send(IpcChannels.REQUEST_CHANNEL, message); };

export const enum RequestMode {
	WaitForResponse = 'wait-for-response',
	FireAndForget = 'fire-and-forget',
}

export const enum MessageType {
	Request = 'request',
	Response = 'response',
}

export interface Invocation {
	id: number;
	resolve(value: any): void;
	reject(error: Error): void;
	invocationTimeout: unknown;
}

export const enum CommunicatorProtocol {
	HEADER_MESSAGE_TYPE = 'comm:message-type',
	HEADER_INVOKE_ID = 'comm:invoke-id',
	HEADER_COMMUNICATOR_ID = 'comm:id',
	HEADER_REQUEST_MODE = 'comm:request-mode',
}

export interface Communicator {
	readonly onRequest: Observable<IpcRequest>;
	readonly onClosed: Observable<void>;
	readonly id: number;
	readonly remoteId: number;

	request(msg: IpcMessage, mode: RequestMode): Promise<IpcResponse>;
	dispose(): void;
}
