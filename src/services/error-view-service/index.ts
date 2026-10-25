import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { ERROR_VIEW_SERVICE_CONTRACT, IErrorViewService } from './ierror-view-service';

export { ERROR_VIEW_SERVICE_CONTRACT, IErrorViewService } from './ierror-view-service';

export function errorViewService(): IErrorViewService {
	return IpcServices.provide<IErrorViewService>(ERROR_VIEW_SERVICE_CONTRACT);
}

export function errorViewServiceProxy(): Promisify<IErrorViewService> {
	return IpcServices.provideProxy<IErrorViewService>(ERROR_VIEW_SERVICE_CONTRACT);
}
