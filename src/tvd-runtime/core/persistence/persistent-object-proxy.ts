import { IPersistentObject, IPersistentObjectImplementation, PersistentObject } from './persistence-core';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PersistentObjectProxy extends IPersistentObject { }

/**
 * Wrap object as persistent.
 */
@PersistentObject
class PersistentObjectProxy implements IPersistentObjectImplementation {
	static proxyHandler: ProxyHandler<PersistentObjectProxy> = {

		set(target: PersistentObjectProxy, key: PropertyKey, value: unknown) {
			if (key in target) {
				return Reflect.set(target, key, value);
			}

			const result = Reflect.set(target.value, key, value);
			target.notifyStateChanged();
			return result;
		},

		get(target: PersistentObjectProxy, key: PropertyKey): unknown {
			if (key in target) {
				return Reflect.get(target, key);
			}

			return Reflect.get(target.value, key);
		},
	};

	value: Record<string, unknown>;

	constructor(value: Record<string, unknown>) {
		this.value = value;
	}

	internalExtractState(): unknown {
		return this.value;
	}

	internalApplyState(state: unknown): void {
		this.value = state as Record<string, unknown>;
	}
}

/**
 *
 */
export function makePersistentObject<T extends Record<string, unknown>>(value: T): T & IPersistentObject {
	const proxy: unknown = new Proxy(new PersistentObjectProxy(value), PersistentObjectProxy.proxyHandler);
	return proxy as (T & IPersistentObject);
}
