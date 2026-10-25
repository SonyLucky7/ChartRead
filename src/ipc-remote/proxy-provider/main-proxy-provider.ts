import { MessageChannelMain, webContents } from 'electron';

import { portRequest } from '../ipc-messages';
import { IpcChannels } from '../ipc-protocol';
import { Communicator } from '../transport/communicator';
import { IIpcInbox } from '../transport/ipc-inbox/base-ipc-inbox';
import { MainCommunicator } from '../transport/main-communicator';
import ProxyProvider from './proxy-provider';

export default class extends ProxyProvider {
	constructor(inbox: IIpcInbox, private proxyHostGetter: (contract: string) => number | undefined) {
		super(inbox);
	}

	protected override createPortCommunicator(contract: string, specificHostId?: number): Promise<Communicator> {
		const hostId = specificHostId ?? this.proxyHostGetter(contract);

		if (hostId === undefined) {
			throw new Error(`Remote instance with contacts [${ contract }] not registered. Instance can not be created.`);
		}

		const host = webContents.fromId(hostId);

		if (host === undefined || host.isDestroyed()) {
			throw new Error(`Host for remote instance with contacts [${ contract }] was destroyed. Instance can not be created.`);
		}

		const channel = new MessageChannelMain();
		host.postMessage(IpcChannels.REQUEST_CHANNEL, portRequest({ id: hostId, remoteId: 0, name: contract }), [channel.port1]);

		return Promise.resolve(new MainCommunicator(0, hostId, channel.port2));
	}
}
