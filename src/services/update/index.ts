import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { AUTO_UPDATE_SERVICE_CONTRACT, IAutoUpdateService } from './iauto-update-service';

export { UpdateStatus } from './iauto-update-service';

export function autoUpdateService(): IAutoUpdateService {
	return IpcServices.provide<IAutoUpdateService>(AUTO_UPDATE_SERVICE_CONTRACT);
}

export function autoUpdateServiceProxy(): Promisify<IAutoUpdateService> {
	return IpcServices.provideProxy<IAutoUpdateService>(AUTO_UPDATE_SERVICE_CONTRACT);
}
