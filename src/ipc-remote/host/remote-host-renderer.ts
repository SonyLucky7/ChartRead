import { ignorePromise } from '../../utils';
import { RemotableInstanceManager } from '../instance/remotable-instance-manager';
import { InstanceProvider } from '../instance-provider';
import { headerValue, IpcRequest, response, responseFailure } from '../ipc-core';
import { registerInstanceRequest, unregisterInstanceRequest } from '../ipc-messages';
import { HostDeadNotificationRequestBody, IpcProtocol, PortRequestBody } from '../ipc-protocol';
import { RendererProxyProvider } from '../proxy-provider';
import { toMainSender } from '../transport/communicator';
import { IpcCommunicator } from '../transport/ipc-communicator';
import { IIpcInbox } from '../transport/ipc-inbox/base-ipc-inbox';
import { RendererCommunicator } from '../transport/renderer-communicator';
import { AbstractRemoteHost } from './abstract-remote-host';

export class RemoteHostRenderer extends AbstractRemoteHost {
	private readonly ipcCommunicator: IpcCommunicator;

	constructor(private inbox: IIpcInbox, instanceProvider: InstanceProvider, remoteManager: RemotableInstanceManager) {
		const ipcCommunicator = new IpcCommunicator(inbox, toMainSender);
		const proxyProvider = new RendererProxyProvider(inbox, ipcCommunicator);
		super(instanceProvider, proxyProvider, remoteManager);
		this.ipcCommunicator = ipcCommunicator;
		this.initInboxing();
	}

	private initInboxing(): void {
		const requestHandlers: { [key: string]: (request: IpcRequest) => void; } = {
			[IpcProtocol.MESSAGE_PORT_REQUEST]: (request: IpcRequest) => {
				const data = request.body as PortRequestBody;
				const port = request.port;

				if (!port) {
					return responseFailure(request, 'Request does not contains port');
				}

				let remotableInstance;
				if (!this.remoteManager.hasInstance(data.name)) {
					if (this.instanceProvider.canProvide(data.name)) {
						const id = this.remoteManager.registerInstance(this.instanceProvider.provide<Record<string, unknown>>(data.name), data.name);
						remotableInstance = this.remoteManager.getInstance(id);
					}
				}
				else {
					remotableInstance = this.remoteManager.getInstance(data.name);
				}

				if (remotableInstance) {
					remotableInstance.addCommunicator(new RendererCommunicator(data.id, data.remoteId, port));
					return;
				}

				response(request, 'Port successfully added');
			},

			[IpcProtocol.MESSAGE_HOST_DEAD_NOTIFICATION]: (request: IpcRequest) => {
				const data = request.body as HostDeadNotificationRequestBody;

				this.remoteManager.onHostDead(data.id);
				this.proxyProviderMember.onHostDead(data.id);
			},
		};

		this.inbox.onRequest.subscribe((request: IpcRequest) => {
			const messageType = headerValue<string>(request, IpcProtocol.HEADER_REQUEST_TYPE);
			try {
				if (messageType && messageType in requestHandlers) {
					requestHandlers[messageType](request);
				}
			}
			catch (error) {
				responseFailure(request, error);
			}
		});
	}

	registerRemoteObject(object: Record<string, unknown>, name: string): string {
		ignorePromise(this.ipcCommunicator.send(registerInstanceRequest({ name })));

		return this.remoteManager.registerInstance(object, name);
	}

	unregisterRemoteObject(name: string): boolean {
		ignorePromise(this.ipcCommunicator.send(unregisterInstanceRequest({ name })));
		return this.remoteManager.unregisterInstance(name);
	}
}
