import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { IMainService, MAIN_SERVICE_CONTRACT } from './imain-service';

export function mainService(): IMainService {
	return IpcServices.provide<IMainService>(MAIN_SERVICE_CONTRACT);
}

export function mainServiceProxy(): Promisify<IMainService> {
	return IpcServices.provideProxy<IMainService>(MAIN_SERVICE_CONTRACT);
}
