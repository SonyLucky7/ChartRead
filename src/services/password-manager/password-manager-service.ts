import keytar from 'keytar';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { PROXY_SERVICE_NAME } from '../../main/network/proxy-credentials';
import { isLinux } from '../../utils';
import { appSettingsService } from '../app-settings-service';
import { Credentials, IPasswordManagerService, PASSWORD_MANAGER_SERVICE_CONTRACT } from './ipassword-manager-service';

@ExposeSingletonService(PASSWORD_MANAGER_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('PasswordManagerService')
export class PasswordManagerService implements IPasswordManagerService {
	defaultServiceName = 'TradingView Desktop';

	permissionsToStorageByService = new Map<string, boolean>([
		[this.defaultServiceName, appSettingsService().get('saveCredentials')],
		[PROXY_SERVICE_NAME, true],
	]);

	setPassword(account: string, password: string, service?: string): void {
		if (!this.canUseStorageByService(service ?? this.defaultServiceName)) {
			return;
		}
		keytar.setPassword(service ?? this.defaultServiceName, account, password)
			.catch(error => {
				loggerService().error('[PasswordManagerService())] set credentials error', error);
			});
	}

	async getPassword(service?: string): Promise<string | null> {
		if (!this.canUseStorageByService(service ?? this.defaultServiceName)) {
			return null;
		}

		const password = await keytar.findPassword(service ?? this.defaultServiceName);
		return password;
	}

	deletePassword(account: string, service?: string): void {
		if (!this.canUseStorageByService(service ?? this.defaultServiceName)) {
			return;
		}
		keytar.deletePassword(service ?? this.defaultServiceName, account)
			.catch(error => {
				loggerService().error('[PasswordManagerService())] set credentials error', error);
			});
	}

	async getCredentialsByService(service?: string): Promise<Credentials[] | undefined> {
		if (this.canUseStorageByService(service ?? this.defaultServiceName)) {
			const credentials = await keytar.findCredentials(service ?? this.defaultServiceName);
			return credentials;
		}
	}

	async deleteCredentials(): Promise<void> {
		if (isLinux()) {
			return;
		}

		const brokerCredentials = await keytar.findCredentials(this.defaultServiceName);

		if (!brokerCredentials) {
			return;
		}

		for (const accountPair of brokerCredentials) {
			await keytar.deletePassword(this.defaultServiceName, accountPair.account);
		}

		const proxyCredentials = await keytar.findCredentials(PROXY_SERVICE_NAME);

		if (!proxyCredentials) {
			return;
		}

		for (const accountPair of brokerCredentials) {
			await keytar.deletePassword(PROXY_SERVICE_NAME, accountPair.account);
		}
	}

	canUseStorageByService(service?: string): boolean {
		const servicePermission = this.permissionsToStorageByService.get(service ?? this.defaultServiceName);

		if (!servicePermission) {
			return false;
		}

		return servicePermission && !isLinux();
	}

	@logCall
	getShouldSaveCredentials(): boolean {
		return appSettingsService().get('saveCredentials');
	}

	@logCall
	setShouldSaveCredentials(answer: boolean): void {
		if (appSettingsService().get('saveCredentials') === answer) {
			return;
		}

		appSettingsService().set('saveCredentials', answer);
	}
}
