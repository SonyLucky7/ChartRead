/* eslint-disable @typescript-eslint/member-ordering */
import { IpcProxy } from '../ipc-proxy';
import { Promisify } from '../promisify';
import { Communicator } from '../transport/communicator';
import { IIpcInbox } from '../transport/ipc-inbox/base-ipc-inbox';

export default abstract class {
	private readonly proxiesCache: Map<number, Map<string, unknown>> = new Map();
	private readonly proxiesQueue: Map<number, Map<string, unknown>> = new Map();

	constructor(protected inbox: IIpcInbox) {}

	public provide<T = unknown>(name: string, specificHostId?: number): Promisify<T> {
		const cachedProxy = this.findCachedProxy<Promisify<T>>(name, specificHostId);

		if (cachedProxy !== null) {
			return cachedProxy;
		}

		const queuedProxy = this.findQueuedProxy<Promisify<T>>(name, specificHostId);

		if (queuedProxy !== null) {
			return queuedProxy;
		}

		return this.enqueueProxyRequest<Promisify<T>>(name, specificHostId);
	}

	public onHostDead(hostId: number): void {
		this.proxiesCache.delete(hostId);
	}

	protected abstract createPortCommunicator(contract: string, specificHostId?: number): Promise<Communicator>;

	private findInDoubleMap<T>(map: Map<number, Map<string, unknown>>, contract: string, hostId?: number): T | null {
		if (hostId !== undefined) {
			const proxy = map.get(hostId)?.get(contract);
			if (proxy !== undefined) {
				return proxy as T;
			}

			return null;
		}

		for (const bucket of map.values()) {
			const proxy = bucket.get(contract);
			if (proxy !== undefined) {
				return proxy as T;
			}
		}

		return null;
	}

	private findCachedProxy<T>(name: string, hostId?: number): T | null {
		return this.findInDoubleMap(this.proxiesCache, name, hostId);
	}

	private findQueuedProxy<T>(name: string, hostId?: number): T | null {
		return this.findInDoubleMap<T>(this.proxiesQueue, name, hostId);
	}

	private enqueueProxyRequest<T>(name: string, hostId?: number): T {
		const proxyCommunicator = this.createPortCommunicator(name, hostId);
		const proxy = IpcProxy.create(proxyCommunicator);
		const actualHostId = hostId ?? -1;

		let bucket = this.proxiesQueue.get(actualHostId);
		if (bucket === undefined) {
			bucket = new Map();
			this.proxiesQueue.set(actualHostId, bucket);
		}

		bucket.set(name, proxy);

		proxyCommunicator.then(communicator => {
			if (actualHostId !== -1 && communicator.remoteId !== actualHostId) {
				throw new Error(`Expected another host id. Expected - ${ actualHostId }, got - ${ communicator.remoteId }`);
			}

			let cacheBucket = this.proxiesCache.get(communicator.remoteId);

			if (cacheBucket === undefined) {
				cacheBucket = new Map();
				this.proxiesCache.set(communicator.remoteId, cacheBucket);
			}

			cacheBucket.set(name, proxy);
		}).catch(err => {
			console.error(err);
		}).finally(() => {
			const queueBucket = this.proxiesQueue.get(actualHostId);

			queueBucket?.delete(name);

			if (queueBucket?.size === 0) {
				this.proxiesQueue.delete(actualHostId);
			}
		});

		return proxy as T;
	}
}
