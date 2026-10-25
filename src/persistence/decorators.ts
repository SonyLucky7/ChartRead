import { GenericConstructor } from '../tvd-runtime/core';
import { isPersistentObject } from '../tvd-runtime/core/persistence/persistence';
import { persistenceService } from '.';

/**
 * @summary
 * Automatically attach class instance to the persistence root.
 * When AttachPersistentRoot is applied its require that class must be already a PersistentObject, so
 * that attribute should be declared prior {@link PersistentCompoundObject} / {@link PersistentObject}.
 *
 * @example
 * export interface MyServce extends IPersistentCompoundObject {}
 *
 * AttachPersistentRoot('myservice')
 * PersistentCompoundObject
 * export class MyService implements IMainService {}
 *
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AttachPersistentRoot(keyName: string) {
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/naming-convention
	return function <T extends GenericConstructor>(Class_: T) {
		return class extends Class_ {
			constructor(...args: any[]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				super(...args);

				if (isPersistentObject(this)) {
					persistenceService().persistentRoot.attach(keyName, this);
				}
				else {
					// eslint-disable-next-line max-len
					// loggerService().error('Object Must be an PersistentObject prior it can be attached to the persistence root. Please declare @PersistentObject decorator after @AttachPersistentRoot');
					throw new Error('Object Must be an PersistentObject prior it can be attached to persistence root');
				}
			}
		};
	};
}
