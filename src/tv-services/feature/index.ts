import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { FEATURE_SERVICE_CONTRACT, IFeatureService } from './ifeature-service';

export function featureService(): IFeatureService {
	return IpcServices.provide<IFeatureService>(FEATURE_SERVICE_CONTRACT);
}

export function featureServiceProxy(): Promisify<IFeatureService> {
	return IpcServices.provideProxy<IFeatureService>(FEATURE_SERVICE_CONTRACT);
}
