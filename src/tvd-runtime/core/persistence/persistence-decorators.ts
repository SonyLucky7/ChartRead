import 'reflect-metadata';

import { GenericConstructor } from '../utils/type-utils';
import {
	ArgsBuilder,
	IPersistentObject,
	PERSISTENT_ARRAY_MKEY,
	PERSISTENT_CONSTRUCTOR_MKEY,
	PERSISTENT_FIELD_MKEY,
	PersistentArrayMeta,
	PersistentConstructorMeta,
	PersistentFieldMeta,
} from './persistence-core';

/**
 *
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PersistentField(opts?: PersistentFieldMeta): PropertyDecorator {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function(target: object, key: string | symbol): void {
		const fieldMeta = Object.assign({}, opts);
		Reflect.defineMetadata(PERSISTENT_FIELD_MKEY, fieldMeta, target.constructor, key);
	};
}

/**
 *
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PersistentArray(item: GenericConstructor, opts?: PersistentFieldMeta): PropertyDecorator {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function(target: object, key: string | symbol): void {
		const fieldMeta: PersistentArrayMeta = Object.assign({
			ctor: item,
		}, opts);

		Reflect.defineMetadata(PERSISTENT_ARRAY_MKEY, fieldMeta, target.constructor, key);
	};
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PersistentConstructor(...args: string[]): ClassDecorator;
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PersistentConstructor(builder: ArgsBuilder): ClassDecorator;
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PersistentConstructor(...args: any[]): ClassDecorator {
	return (ctor: object): void => {
		let argsBuilder: ArgsBuilder;

		if (args.length === 1 && typeof args[0] !== 'string') {
			argsBuilder = args[0] as ArgsBuilder;
		}
		else {
			argsBuilder = (parent: IPersistentObject, state: Record<string, unknown>): unknown[] => {
				const resultArgs: Array<unknown> = [];

				for (const prop of args as string[]) {
					const argValue: unknown = prop in state ? state[prop] : undefined;
					resultArgs.push(argValue);
				}

				return resultArgs;
			};
		}
		const meta: PersistentConstructorMeta = {
			argsBuilder,
		};

		Reflect.defineMetadata(PERSISTENT_CONSTRUCTOR_MKEY, meta, ctor);
	};
}
