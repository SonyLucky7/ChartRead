import { logCall, logCallName } from '../../../logger/log-decorator';
import { Disposable } from '../interfaces';
import { GenericConstructor } from '../utils/type-utils';
import * as PCore from './persistence-core';

const isNumber = ((): (num: string) => boolean => {
	const re__ = /^\d+$/;
	return (num: string): boolean => {
		return re__.test(num);
	};
})();

function constructItem(parent: PCore.IPersistentObject, ctor: GenericConstructor, state: Record<string, unknown>): any {
	const meta = Reflect.getMetadata(PCore.PERSISTENT_CONSTRUCTOR_MKEY, ctor) as PCore.PersistentConstructorMeta | undefined;

	if (!meta) {
		// eslint-disable-next-line new-cap
		return new ctor();
	}

	const args = meta.argsBuilder(parent, state);
	// eslint-disable-next-line new-cap
	return new ctor(...args);
}

interface MethodDesc {
	key: string;
	modifier: boolean;
	closeResultItems: boolean;
	newItemsArgIndex?: number;
}

const arrayProxyMethods: MethodDesc[] = [
	{
		key: 'pop',
		modifier: true,
		closeResultItems: true,
	},

	{
		key: 'push',
		modifier: true,
		closeResultItems: false,
		newItemsArgIndex: 0,
	},

	{
		key: 'reverse',
		modifier: true,
		closeResultItems: false,
	},
	{
		key: 'shift',
		modifier: true,
		closeResultItems: true,
	},

	{
		key: 'unshift',
		modifier: true,
		closeResultItems: false,
		newItemsArgIndex: 0,
	},

	{
		key: 'splice',
		modifier: true,
		closeResultItems: true,
		newItemsArgIndex: 2,
	},

	{
		key: 'indexOf',
		modifier: false,
		closeResultItems: false,
	},

	{
		key: 'map',
		modifier: false,
		closeResultItems: false,
	},

	{
		key: 'filter',
		modifier: false,
		closeResultItems: false,
	},
];

interface PersistentArrayProxy extends PCore.IPersistentObject, Disposable {
}

@PCore.PersistentObject
@logCallName('PersistentArrayProxy')
class PersistentArrayProxy implements PCore.IPersistentObjectImplementation {
	// eslint-disable-next-line no-use-before-define
	static handler: ProxyHandler<PersistentArrayProxy> = {
		set(target: PersistentArrayProxy, key: PropertyKey, value: unknown) {
			if (key in target) {
				return Reflect.set(target, key, value);
			}

			if (typeof key === 'string' && isNumber(key)) {
				const item: unknown = Reflect.get(target.items, key);
				if (item && PCore.isPersistentNode(item)) {
					PCore.closePersistentNode(item);
				}

				const newItem: unknown = PCore.isPersistentObject(value)
					? PCore.makePersistentNode(target, value)
					: value;

				const result = Reflect.set(target.items, key, newItem);
				target.notifyStateChanged();
				return result;
			}

			return Reflect.set(target.items, key, value);
		},

		get(target: PersistentArrayProxy, key: string | number | symbol): unknown {
			if (key in target) {
				return Reflect.get(target, key);
			}

			const methodDesc = arrayProxyMethods.find(m => m.key === key);
			if (!methodDesc) {
				const v: unknown = Reflect.get(target.items, key);

				if (typeof v !== 'function') {
					return v;
				}

				return (...args: any[]) => {
					const func = Reflect.get(Array.prototype, key) as ((...a: unknown[]) => unknown);
					const res: unknown = func.apply(target.items, args);
					return res;
				};
			}

			if (!methodDesc || !methodDesc.modifier) {
				return (...args: unknown[]) => {
					const func = Reflect.get(Array.prototype, key) as (...a: unknown[]) => unknown;
					const res = func.apply(target.items, args);
					return res;
				};
			}

			const methodProxy: (...a: unknown[]) => unknown = (...args: any[]) => {
				if (typeof methodDesc.newItemsArgIndex !== 'undefined') {
					for (let i = methodDesc.newItemsArgIndex; i < args.length; ++i) {
						const item: unknown = args[i];
						if (PCore.isPersistentObject(item)) {
							PCore.makePersistentNode(target, item);
						}
					}
				}

				const func = Reflect.get(Array.prototype, key) as (...a: unknown[]) => unknown;
				const result = func.apply(target.items, args);
				if (result && Array.isArray(result) && methodDesc.closeResultItems) {
					for (const item of result) {
						if (PCore.isPersistentNode(item)) {
							PCore.closePersistentNode(item);
						}
					}
				}

				target.notifyStateChanged();
				return result;
			};

			return methodProxy;
		},

	}; // handler declaration

	items: any[] = [];
	itemConstructor: new (...args: any[]) => any;

	constructor(itemConstructor: GenericConstructor) {
		this.itemConstructor = itemConstructor;
	}

	@logCall
	internalExtractState(): unknown {
		const state: Array<unknown> = [];

		for (const value of this.items) {
			if (PCore.isPersistentNode(value)) {
				state.push(value.extractState());
			}
			else {
				state.push(value);
			}
		}
		return state;
	}

	@logCall
	internalApplyState(state: unknown): Promise<void> | void {
		if (!this.itemConstructor) {
			console.error('Do not known how to construct item');
			this.resetItems(state as []);
			return;
		}

		const applyOperations: Promise<void>[] = [];

		const newItems = (state as []).map(itemState => {
			const item: unknown = constructItem(this, this.itemConstructor, itemState);

			if (PCore.isPersistentObject(item)) {
				PCore.makePersistentNode(this, item);
				const operation = item.applyState(itemState);
				if (operation instanceof Promise) {
					applyOperations.push(operation);
				}
			}

			return item;
		});

		this.resetItems(newItems);

		if (applyOperations.length === 0) {
			return;
		}
		const composed: unknown = Promise.all(applyOperations);
		return composed as Promise<void>;
	}

	@logCall
	private resetItems(items: any[]): void {
		this.items.forEach(item => {
			if (PCore.isPersistentNode(item)) {
				PCore.closePersistentNode(item);
			}

			if ('dispose' in item) {
				(item as Disposable).dispose();
			}
		});

		this.items = items;
	}
}

export function makePersistentArray<T>(constr: GenericConstructor): [T] & PCore.IPersistentObject {
	const target = new PersistentArrayProxy(constr);
	const proxy: unknown = new Proxy(target, PersistentArrayProxy.handler);
	return proxy as ([T] & PCore.IPersistentObject);
}
