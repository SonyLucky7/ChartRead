import { IPersistenceService } from './ipersistence-service';
import { PersistenceService } from './persistence-service';

export {
	IPersistentObject,
	IPersistentObjectImplementation,
	IPersistentCompoundObject,
	PersistentObject,
	PersistentCompoundObject,
	PersistentField,
	PersistentArray,
	PersistentConstructor,
} from '../tvd-runtime/core/persistence/persistence';

export * from './ipersistence-service';
export * from './decorators';
export { PersistenceService } from './persistence-service';

let persistenceServiceInstance: IPersistenceService | undefined;
export function persistenceService(): IPersistenceService {
	if (!persistenceServiceInstance) {
		persistenceServiceInstance = new PersistenceService();
	}

	return persistenceServiceInstance;
}
