import { ignorePromise } from '../../../utils';
import { Disposable } from '../interfaces';
import { GenericConstructor } from '../utils/type-utils';
import * as PCore from './persistence-core';
import { makePersistentArray } from './persistent-array-proxy';
import { makePersistentObject } from './persistent-object-proxy';

// type KeyValueStorage = {[key: string]: any} ;

export interface IPersistentCompoundObject extends PCore.IPersistentObject, Disposable {
	attach(key: string, obj: PCore.IPersistentObject): void;
	detach(key: string): void;
}

/**
 *
 */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/naming-convention
export function PersistentCompoundObject<T extends GenericConstructor>(Class_: T) {
	return class extends PCore.PersistentObject(Class_) implements PCore.IPersistentObjectImplementation {
		persistentState: Record<string, unknown> = {};

		constructor(...args: unknown[]) {
			super(...args);

			const attachPersistentField = (key: string, metaName: string | undefined, proxy: PCore.IPersistentObject): void => {
				const attachName = metaName || key;
				this.attach(attachName, proxy);
				Reflect.set(this, key, proxy);
			};

			const properties = Object.getOwnPropertyNames(this);
			// eslint-disable-next-line @typescript-eslint/ban-types
			const metaInfoTarget = (this as object).constructor;

			for (const key of properties) {
				const fieldMeta = Reflect.getMetadata(PCore.PERSISTENT_FIELD_MKEY, metaInfoTarget, key) as PCore.PersistentFieldMeta | undefined;
				let arrayMeta: PCore.PersistentArrayMeta | undefined;
				if (!fieldMeta) {
					arrayMeta = Reflect.getMetadata(PCore.PERSISTENT_ARRAY_MKEY, metaInfoTarget, key) as typeof arrayMeta;
				}

				if (fieldMeta) {
					const originalProperty = Reflect.get(this, key) as Record<string, unknown>;
					const propType = typeof originalProperty;

					if (propType !== 'object') {
						console.debug(`Field (${ key }) of type (${ propType }) currently can not be used as auto persistent field`);
						continue;
					}

					const field = PCore.isPersistentObject(originalProperty) ? originalProperty : makePersistentObject(originalProperty);
					attachPersistentField(key, fieldMeta.name, field);
				}
				else if (arrayMeta) {
					const proxy = makePersistentArray(arrayMeta.ctor);
					attachPersistentField(key, arrayMeta.name, proxy);
				}
			}
		}

		attach(key: string, obj: PCore.IPersistentObject): void {
			if (key in this.persistentState) {
				const state = this.persistentState[key];
				if (typeof state !== 'undefined') {
					const op = obj.applyState(state);
					if (op instanceof Promise) {
						ignorePromise(op);
					}
				}
			}

			this.persistentState[key] = PCore.makePersistentNode(this, obj);
		}

		detach(key: string): void {
			if (key in this.persistentState && PCore.isPersistentNode(this.persistentState[key])) {
				PCore.closePersistentNode(this.persistentState[key]);
			}
		}

		internalExtractState(): any {
			const state: Record<string, unknown> = {};

			for (const prop of Object.keys(this.persistentState)) {
				const myValue = this.persistentState[prop];
				if (PCore.isPersistentNode(myValue)) {
					state[prop] = myValue.extractState();
				}
				else {
					state[prop] = myValue;
				}
			}

			return state;
		}

		internalApplyState(state: Record<string, unknown>): Promise<void> | void {
			const applyOperations: Promise<void>[] = [];

			for (const prop of Object.keys(state)) {
				const value: unknown = Reflect.get(state, prop); // state[prop];
				if (!(prop in this.persistentState)) {
					this.persistentState[prop] = value;
					continue;
				}

				const myValue = this.persistentState[prop];
				if (PCore.isPersistentNode(myValue)) {
					const operation = myValue.applyState(value);
					if (operation instanceof Promise) {
						applyOperations.push(operation);
					}
				}
				else {
					this.persistentState[prop] = value;
				}
			}

			if (applyOperations.length === 0) {
				return;
			}
			const composed: unknown = Promise.all(applyOperations);
			return composed as Promise<void>;
		}
	};
}
