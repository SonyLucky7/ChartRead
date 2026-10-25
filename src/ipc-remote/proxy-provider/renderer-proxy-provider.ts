import { headerValue } from '../ipc-core';
import { instanceRequest } from '../ipc-messages';
import { IpcProtocol, PortRendererResponseBody } from '../ipc-protocol';
import { Communicator } from '../transport/communicator';
import { IpcCommunicator } from '../transport/ipc-communicator';
import { IIpcInbox } from '../transport/ipc-inbox/base-ipc-inbox';
import { RendererCommunicator } from '../transport/renderer-communicator';
import ProxyProvider from './proxy-provider';

function extractPort(body: unknown): MessagePort | undefined {
	return (body as PortRendererResponseBody).port;
}

export default class extends ProxyProvider {
	constructor(inbox: IIpcInbox, private ipcCommunicator: IpcCommunicator) {
		super(inbox);
	}

	protected override async createPortCommunicator(contract: string, specificHostId?: number): Promise<Communicator> {
		const response = await this.ipcCommunicator.send(instanceRequest({ contract, specificHostId }));
		const port = extractPort(response.body);

		if (port === undefined) {
			throw new Error(`Remote host didn't provide port for instance with [${ contract }]. Instance can not be created.`);
		}

		const selfId = headerValue<number>(response, IpcProtocol.HEADER_HOST_ID);

		if (selfId === undefined) {
			throw new Error('Main RemoteHost didn\'t provide id. Instance can not be created.');
		}

		return new RendererCommunicator(selfId, 0, port);
	}
}
