import { ipcRenderer } from 'electron';

import { IpcMessage } from './ipc-core';
import { registerInstanceRequest } from './ipc-messages';
import { IpcChannels } from './ipc-protocol';
import { IpcCommunicator } from './transport/ipc-communicator';
import { IIpcInbox } from './transport/ipc-inbox/base-ipc-inbox';

const isMainProcess = ipcRenderer === undefined;

export type InstanceFactory = (...args: unknown[]) => unknown;

export class InstanceProvider {
	private readonly factories: Map<string, InstanceFactory> = new Map();
	private communicatorMember: IpcCommunicator | null = null;
	private factoryRegistractionQueue: (() => void)[] = [];

	constructor(private inbox: IIpcInbox) {
		if (!isMainProcess) {
			this.communicator();
			this.factoryRegistractionQueue.forEach(registerAction => registerAction());
			this.factoryRegistractionQueue = [];
		}
	}

	private tryCreate(contract: string, ...args: unknown[]): unknown | undefined {
		const factory = this.factories.get(contract);

		if (factory) {
			return factory(...args);
		}

		return undefined;
	}

	registerFactory(contract: string, factory: InstanceFactory): void {
		if (this.factories.has(contract)) {
			throw new Error(`Service factory with contract [${ contract }] registered already`);
		}

		if (!isMainProcess) {
			const registerAction = (): void => {
				this.communicatorMember?.send(registerInstanceRequest({ name: contract }))
					.catch(err => console.error(err));
			};

			if (this.communicatorMember) {
				registerAction();
			}
			else {
				this.factoryRegistractionQueue.push(registerAction);
			}
		}

		this.factories.set(contract, factory);
	}

	canProvide(contract: string): boolean {
		return this.factories.has(contract);
	}

	provide<T = unknown>(contract: string, ...args: unknown[]): T {
		const instance: T = this.tryCreate(contract, ...args) as T;

		if (!instance) {
			throw new Error(`Local service with contracts [${ contract }] not registered. Instance can not be created.`);
		}
		return instance;
	}

	private communicator(): IpcCommunicator {
		if (isMainProcess) {
			throw new Error('Creating ServiceProvider communicator in main process');
		}

		const toMainSender = (message: IpcMessage): void => { ipcRenderer.send(IpcChannels.REQUEST_CHANNEL, message); };

		if (!this.communicatorMember) {
			this.communicatorMember = new IpcCommunicator(this.inbox, toMainSender);
		}

		return this.communicatorMember;
	}
}
