import { Promisify } from '../ipc-remote';
import { IpcServices } from '../ipc-services';
import { MainNetworkService, RemoteNetworkService } from './network/interfaces';

export const NETWORK_SERVICE_CONTRACT = 'tvd:network-service';

export function networkService(): MainNetworkService {
	return IpcServices.provide<MainNetworkService>(NETWORK_SERVICE_CONTRACT);
}

export function networkServiceProxy(): Promisify<RemoteNetworkService> {
	return IpcServices.provideProxy<RemoteNetworkService>(NETWORK_SERVICE_CONTRACT);
}
