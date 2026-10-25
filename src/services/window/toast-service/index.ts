import { Promisify } from '../../../ipc-remote';
import { IpcServices } from '../../../ipc-services';
import { IToastService, TOAST_SERVICE_CONTRACT } from './itoast-service';

export function toastService(): IToastService {
	return IpcServices.provide<IToastService>(TOAST_SERVICE_CONTRACT);
}

export function toastServiceProxy(): Promisify<IToastService> {
	return IpcServices.provideProxy<IToastService>(TOAST_SERVICE_CONTRACT);
}
