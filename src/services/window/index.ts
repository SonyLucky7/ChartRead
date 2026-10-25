import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { IWindowService, WINDOW_SERVICE_CONTRACT } from './iwindow-service';

export * from './iwindow-service';

export function windowService(): IWindowService {
	return IpcServices.provide<IWindowService>(WINDOW_SERVICE_CONTRACT);
}

export function windowServiceProxy(): Promisify<IWindowService> {
	return IpcServices.provideProxy<IWindowService>(WINDOW_SERVICE_CONTRACT);
}
