import { ipcMain } from 'electron';
import { uuid } from 'uuidv4';

import { AbstractRemoteHost, IIpcInbox, InstanceProvider, MainIpcInbox, Promisify, RemotableInstanceManager, RemoteHost, RemoteHostRenderer, RendererIpcInbox } from '../ipc-remote';

let host: AbstractRemoteHost | null = null;
let manager: RemotableInstanceManager | null = null;
let inbox: IIpcInbox | null = null;
let provider: InstanceProvider | null = null;

const instanceUidLength = 8;

function generateInstanceId(postfix: string): string {
	const uid = uuid().slice(0, instanceUidLength);
	const id = `${ uid }-${ postfix }`;
	return id;
}

export function initializeRpc(): void {
	if (host) {
		return;
	}

	host = createHost();
}

export function provide<T = unknown>(contract: string): T {
	if (!host) {
		throw new Error('Rpc: host not initialized');
	}

	return host.instanceProvider.provide<T>(contract);
}

export function provideProxy<T = unknown>(name: string, specificHostId?: number | undefined): Promisify<T> {
	if (!host) {
		throw new Error('Rpc: host not initialized');
	}

	return host.proxyProvider.provide<T>(name, specificHostId);
}

export function registerRemoteService<T = Record<string, unknown>>(instance: T, name: string): void {
	if (!host) {
		throw new Error('Rpc: host not initialized');
	}

	host.registerRemoteObject(instance as Record<string, unknown>, name);
}

export function registerRemoteObject<T = Record<string, unknown>>(instance: T, postfix?: string): string {
	if (!host) {
		throw new Error('Rpc: host not initialized');
	}

	const uniqueName = postfix ? generateInstanceId(postfix) : generateInstanceId('anonymous');

	return host.registerRemoteObject(instance as Record<string, unknown>, uniqueName);
}

export function unregisterRemoteObject(name: string): boolean {
	if (!host) {
		throw new Error('Rpc: host not initialized');
	}

	return host.unregisterRemoteObject(name);
}

function createHost(): AbstractRemoteHost {
	if (ipcMain) {
		return new RemoteHost(getInbox(), getProvider(), getManager());
	}

	return new RemoteHostRenderer(getInbox(), getProvider(), getManager());
}

function getManager(): RemotableInstanceManager {
	if (!manager) {
		manager = new RemotableInstanceManager();
	}

	return manager;
}

function getInbox(): IIpcInbox {
	if (!inbox) {
		inbox = ipcMain ? new MainIpcInbox() : new RendererIpcInbox();
	}

	return inbox;
}

export function getProvider(): InstanceProvider {
	if (!provider) {
		provider = new InstanceProvider(getInbox());
	}

	return provider;
}
