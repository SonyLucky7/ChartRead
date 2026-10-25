import { MessageChannelMain, WebContents, webContents } from 'electron';

import { SequenceSynchronizer } from '../../sequence-synchronizer/sequence-synchronizer';
import { RemotableInstanceManager } from '../instance/remotable-instance-manager';
import { InstanceProvider } from '../instance-provider';
import { headerValue, IpcRequest, response, responseFailure } from '../ipc-core';
import { hostDeadNotificationRequest, portRequest } from '../ipc-messages';
import { InstanceRequestBody, IpcChannels, IpcProtocol, RegisterInstanceRequestBody, UnregisterInstanceRequestBody } from '../ipc-protocol';
import { MainProxyProvider } from '../proxy-provider';
import { IIpcInbox } from '../transport/ipc-inbox/base-ipc-inbox';
import { MainCommunicator } from '../transport/main-communicator';
import { AbstractRemoteHost } from './abstract-remote-host';

export class RemoteHost extends AbstractRemoteHost {
	private readonly knownHosts: Set<number> = new Set();
	private readonly remoteInstancesRegistry: Map<string, Set<number>> = new Map();
	private hostDeadSynchronizer = new SequenceSynchronizer(this.onHostsDead.bind(this));

	constructor(private inbox: IIpcInbox, instanceProvide: InstanceProvider, remoteManager: RemotableInstanceManager) {
		super(
			instanceProvide,
			new MainProxyProvider(inbox, (contract) => { return this.remoteInstancesRegistry.get(contract)?.values().next().value as number; }),
			remoteManager
		);

		this.initInboxing();
	}

	private initInboxing(): void {
		const requestHandlers: { [key: string]: (request: IpcRequest) => void; } = {
			[IpcProtocol.MESSAGE_REGISTER_INSTANCE]: (request: IpcRequest) => {
				const data = request.body as RegisterInstanceRequestBody;

				const hostId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0;
				if (!hostId) {
					return responseFailure(request, 'RegisterInstanse request must contain sender id');
				}

				const remoteHost = webContents.fromId(hostId);

				if (!remoteHost || remoteHost.isDestroyed()) {
					return responseFailure(request, `ServiceHost for contracts [${ data.name }] does not exists anymore`);
				}

				this.rememberHost(remoteHost);

				this.registerHostForContract(data.name, hostId);

				response(request, 'Successful registered');
			},

			[IpcProtocol.MESSAGE_UNREGISTER_INSTANCE]: (request: IpcRequest) => {
				const data = request.body as UnregisterInstanceRequestBody;
				const hostId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0;

				this.unregisterForContract(data.name, hostId);

				response(request, 'Successful unregistered');
			},

			[IpcProtocol.MESSAGE_GET_INSTANCE]: (request: IpcRequest) => {
				const data = request.body as InstanceRequestBody;
				const contract = data.contract;
				const specificHostId = data.specificHostId;
				const requestingHost = webContents.fromId(headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0);

				if (!requestingHost) {
					return;
				}

				this.rememberHost(requestingHost);

				if (specificHostId === undefined) {
					let remotableInstance;
					if (!this.remoteManager.hasInstance(contract)) {
						if (this.instanceProvider.canProvide(contract)) {
							const id = this.remoteManager.registerInstance(this.instanceProvider.provide<Record<string, unknown>>(contract), contract);
							remotableInstance = this.remoteManager.getInstance(id);
						}
					}
					else {
						remotableInstance = this.remoteManager.getInstance(contract);
					}

					if (remotableInstance) {
						const channel = new MessageChannelMain();

						remotableInstance.addCommunicator(new MainCommunicator(0, requestingHost.id, channel.port1));
						return response(request, {
							id: requestingHost.id,
							remoteId: 0,
							port: channel.port2,
						});
					}
				}

				const remoteHosts = this.remoteInstancesRegistry.get(contract);

				if (!remoteHosts || remoteHosts.size === 0) {
					return responseFailure(request, `Service with contracts [${ contract }] not registered , and remoting not configured.`);
				}

				if (specificHostId && !remoteHosts.has(specificHostId)) {
					return responseFailure(request, `Service with contracts [${ contract }] not registered for specific id ${ specificHostId }, and remoting not configured.`);
				}

				const targetHostId = specificHostId ?? remoteHosts.values().next().value as number;
				const targetHost = webContents.fromId(targetHostId);

				if (!targetHost) {
					return responseFailure(request, `ServiceHost with id ${ specificHostId } for contracts [${ contract }] does not exists anymore`);
				}

				const channel = new MessageChannelMain();

				targetHost.postMessage(IpcChannels.REQUEST_CHANNEL, portRequest({ id: targetHost.id, remoteId: requestingHost.id, name: data.contract }), [channel.port1]);
				response(request, {
					id: requestingHost.id,
					remoteId: targetHost.id,
					port: channel.port2,
				});
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

	private rememberHost(host: WebContents): void {
		if (host.isDestroyed()) {
			this.knownHosts.delete(host.id);
		}

		if (this.knownHosts.has(host.id)) {
			return;
		}

		this.knownHosts.add(host.id);
		this.setupHostAliveWatchdog(host);
	}

	registerRemoteObject(object: Record<string, unknown>, name: string): string {
		return this.remoteManager.registerInstance(object, name);
	}

	unregisterRemoteObject(name: string): boolean {
		return this.remoteManager.unregisterInstance(name);
	}

	private registerHostForContract(contract: string, id: number): void {
		let hosts = this.remoteInstancesRegistry.get(contract);

		if (!hosts) {
			hosts = new Set();
			this.remoteInstancesRegistry.set(contract, hosts);
		}

		hosts.add(id);
	}

	private unregisterForContract(contract: string, id: number): void {
		const hosts = this.remoteInstancesRegistry.get(contract);

		if (hosts) {
			hosts.delete(id);
		}

		if (hosts?.size === 0) {
			this.remoteInstancesRegistry.delete(contract);
		}
	}

	private setupHostAliveWatchdog(host: WebContents): void {
		host.once('destroyed', () => {
			this.removeRemoteHost(host.id);
			this.hostDeadSynchronizer.sync(host.id);
		});

		host.once('render-process-gone', () => {
			this.removeRemoteHost(host.id);
			this.hostDeadSynchronizer.sync(host.id);
		});
	}

	private removeRemoteHost(remoteHostId: number): void {
		const contractsForDelete: string[] = [];

		this.remoteInstancesRegistry.forEach((value, key) => {
			value.delete(remoteHostId);

			if (value.size === 0) {
				contractsForDelete.push(key);
			}
		});

		contractsForDelete.forEach(contract => {
			this.remoteInstancesRegistry.delete(contract);
		});

		this.knownHosts.delete(remoteHostId);
		this.remoteManager.onHostDead(remoteHostId);
		this.proxyProviderMember.onHostDead(remoteHostId);
	}

	private onHostsDead(deadHosts: Set<number>): void {
		const hostsToNotify = this.knownHosts.difference(deadHosts);

		hostsToNotify.forEach(hostToNotify => {
			const host = webContents.fromId(hostToNotify);

			if (!host || host.isDestroyed()) {
				return;
			}

			deadHosts.forEach(deadHostId => {
				host.postMessage(IpcChannels.REQUEST_CHANNEL, hostDeadNotificationRequest({ id: deadHostId }));
			});
		});
	}
}
