import { ipcMain } from 'electron';

import { GenericConstructor } from '../tvd-runtime/core/utils/type-utils';
import { shortifyId } from './log-formatter';
import { loggerService, loggerServiceProxy } from '.';

type ObjectLike = {
	name?: string;
	constructor?: { name?: string; };
};

type WithId = {
	id?: string;
	remoteServiceInstanceId?: string;
};

const LOGCALL_CLASSNAME_KEY = Symbol('LogCallClassName');

export function logCall(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
	const func = descriptor.value as unknown;

	descriptor.value = function(...args: unknown[]) {
		if (typeof func === 'function') {
			const targetObject = target as ObjectLike;

			// eslint-disable-next-line @typescript-eslint/ban-types
			const classNameInReflect = Reflect.getMetadata(LOGCALL_CLASSNAME_KEY, (target as object).constructor) as string;
			const className = classNameInReflect ?? targetObject.name ?? targetObject.constructor?.name;

			const logMessage = `${ getObjectId(this as WithId) }${ className ?? 'anonymous' }.${ propertyKey }()`;

			try {
				if (ipcMain) {
					loggerService().debug(logMessage);
				}
				else {
					loggerServiceProxy().debug(logMessage);
				}
			}
			catch (err) {
				console.log(logMessage);
			}

			return func.apply(this, args) as unknown;
		}
	};

	return descriptor;
}

export function logCallName(className: string) {
	return (constructor: GenericConstructor): void => {
		Reflect.defineMetadata(LOGCALL_CLASSNAME_KEY, className, constructor);
	};
}

function getObjectId(obj: WithId): string {
	let id = '';

	if (obj.id) {
		id = obj.id;
	}
	if (obj.remoteServiceInstanceId) {
		id = obj.remoteServiceInstanceId;
	}
	if (id === '') {
		return id;
	}

	return `[${ shortifyId(id) }] `;
}
