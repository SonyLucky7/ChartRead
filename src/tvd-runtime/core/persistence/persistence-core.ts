import 'reflect-metadata';
import { Observable, Subject, Subscription as RxSubscription } from 'rxjs';

import { loggerService } from '../../../logger';
import { GenericConstructor } from '../utils/type-utils';

export const PERSISTENT_FIELD_MKEY = Symbol('persistent_field_meta_key');
export const PERSISTENT_ARRAY_MKEY = Symbol('persistent_array_meta_key');
export const PERSISTENT_CONSTRUCTOR_MKEY = Symbol('persistent_constructor_meta_key');

export type ArgsBuilder = (parent: IPersistentObject, state: Record<string, unknown>) => unknown[];

export interface PersistentFieldMeta {
	name?: string;
}

export interface PersistentArrayMeta extends PersistentFieldMeta {
	ctor: GenericConstructor;
}

export interface PersistentConstructorMeta {
	argsBuilder: ArgsBuilder;
}

/**
 *
 */
export interface IPersistentObject {
	extractState(): any;
	applyState(state: any): Promise<void> | void;
	notifyStateChanged(): void;
	readonly stateIsApplying: boolean;
	changed: Observable<IPersistentObject>;
	changedNotificationsEnabled: boolean;
}

export interface IPersistentObjectEvents {
	beforeStateApplying(): void;
	stateApplied(): void;
}
/**
 *
 */
export interface IPersistentObjectImplementation {
	internalExtractState(): unknown;
	internalApplyState(state: unknown): Promise<void> | void;
}

function isIPersistentObjectImplementation(obj: unknown): obj is IPersistentObjectImplementation {
	return obj !== null && typeof obj === 'object' && 'internalApplyState' in obj;
}

/**
 *
 */
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/ban-types, @typescript-eslint/naming-convention
export function PersistentObject<T extends GenericConstructor>(Class_: T) {
	return class extends Class_ implements IPersistentObject {
		readonly changedSubject = new Subject<IPersistentObject>();
		readonly changed = this.changedSubject.asObservable();
		changedNotificationsEnabled = true;
		stateIsApplying = false;

		notifyStateChanged(): void {
			if (this.changedNotificationsEnabled && !this.stateIsApplying) {
				this.changedSubject.next(this);
			}
		}

		extractState(): unknown {
			if (!isIPersistentObjectImplementation(this)) {
				return;
			}
			const state = this.internalExtractState();
			return state;
		}

		applyState(state: unknown): Promise<void> | void {
			if (this.stateIsApplying) {
				return Promise.reject(new Error('Cannot apply state now (applying already is processed)'));
			}

			this.stateIsApplying = true;
			let needRestoreApplyingState = true;

			const afterStateApplied = (): void => {
				this.stateIsApplying = false;

				if ('stateApplied' in this && typeof this.stateApplied === 'function') {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					this.stateApplied();
				}
			};

			if ('beforeStateApplying' in this && typeof this.beforeStateApplying === 'function') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				this.beforeStateApplying();
			}

			try {
				if (isIPersistentObjectImplementation(this)) {
					const operation = this.internalApplyState(state);
					if (operation instanceof Promise) {
						needRestoreApplyingState = false;
						operation
							.catch((err) => {
								loggerService().error('[PersistentObject.applyState()] Failed to restore state', err);
							})
							.finally(() => {
								afterStateApplied();
							});
					}

					return operation;
				}
			}
			finally {
				if (needRestoreApplyingState) {
					afterStateApplied();
				}
			}
		}

		// get changed(): Observable<IPersistentObject> {
		// 	return this._changed;
		// }

		// get changedNotificationsEnabled(): boolean {
		// 	return this._changedNotificationsEnabled;
		// }

		// set changedNotificationsEnabled(enabled: boolean) {
		// 	this._changedNotificationsEnabled = enabled;
		// }

		// get stateIsApplying(): boolean {
		// 	return this._stateIsApplying;
		// }
	};
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isPersistentObject(obj: unknown): obj is IPersistentObject {
	if (typeof obj !== 'object' || obj === null) {
		return false;
	}

	const hasPropertyFunction = (key: string): boolean => {
		const value: unknown = Reflect.get(obj, key);
		return typeof value === 'function';
	};

	return hasPropertyFunction('extractState') &&
		hasPropertyFunction('applyState') &&
		hasPropertyFunction('notifyStateChanged') && 'changed' in obj;
}

export function modifyWithoutNotifications<T extends IPersistentObject>(obj: T, callback: (o: T) => unknown): unknown {
	const wasEnabled = obj.changedNotificationsEnabled;
	let result: any;

	try {
		obj.changedNotificationsEnabled = false;
		result = callback(obj);
	}
	finally {
		obj.changedNotificationsEnabled = wasEnabled;
	}

	return result;
}

export function modifyNotifyOnce<T extends IPersistentObject>(obj: T, callback: (o: T) => unknown): unknown {
	const wasEnabled = obj.changedNotificationsEnabled;
	let result: any;

	try {
		obj.changedNotificationsEnabled = false;
		result = callback(obj);
		obj.notifyStateChanged();
	}
	finally {
		obj.changedNotificationsEnabled = wasEnabled;
	}

	return result;
}

export interface PersistentNode extends IPersistentObject {
	persistentParent: IPersistentObject;
	persistentChangedSubscription: RxSubscription;
}

export function isPersistentNode(obj: unknown): obj is PersistentNode {
	if (!obj || typeof obj !== 'object') {
		return false;
	}

	const node = obj as Partial<PersistentNode>;
	return 'persistentParent' in node && 'persistentChangedSubscription' in node;
}

export function makePersistentNode(parent: IPersistentObject, obj: IPersistentObject): PersistentNode {
	Object.defineProperty(obj, 'persistentParent', {
		value: parent,
		enumerable: false,
		configurable: true,
	});

	const subscription = obj.changed.subscribe(() => {
		parent.notifyStateChanged();
	});

	Object.defineProperty(obj, 'persistentChangedSubscription', {
		value: subscription,
		enumerable: false,
		configurable: true,

	});

	return (obj as unknown) as PersistentNode;
}

export function closePersistentNode(obj: PersistentNode): void {
	obj.persistentChangedSubscription.unsubscribe();

	delete (obj as Partial<PersistentNode>).persistentChangedSubscription;
	delete (obj as Partial<PersistentNode>).persistentParent;
}
