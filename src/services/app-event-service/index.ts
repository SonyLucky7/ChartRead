import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { APP_EVENT_SERVICE_CONTRACT, IAppEventService } from './iapp-event-service';

export function appEventService(): IAppEventService {
	return IpcServices.provide<IAppEventService>(APP_EVENT_SERVICE_CONTRACT);
}

export function appEventServiceProxy(): Promisify<IAppEventService> {
	return IpcServices.provideProxy<IAppEventService>(APP_EVENT_SERVICE_CONTRACT);
}
