import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { IPasswordManagerService, PASSWORD_MANAGER_SERVICE_CONTRACT } from './ipassword-manager-service';

export { Credentials, ElementAttributes, CredentialsToInput } from './ipassword-manager-service';

export function passwordManagerService(): IPasswordManagerService {
	return IpcServices.provide<IPasswordManagerService>(PASSWORD_MANAGER_SERVICE_CONTRACT);
}

export function passwordManagerServiceProxy(): Promisify<IPasswordManagerService> {
	return IpcServices.provideProxy<IPasswordManagerService>(PASSWORD_MANAGER_SERVICE_CONTRACT);
}
