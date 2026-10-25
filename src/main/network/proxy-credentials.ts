import { ipcMain } from 'electron';

import { loggerService } from '../../logger';
import { Credentials, passwordManagerService as passwordManagerServiceMain, passwordManagerServiceProxy } from '../../services/password-manager';

export const PROXY_SERVICE_PASSWORD_NAME = 'config1';
export const PROXY_SERVICE_ACCOUNT_NAME = 'config2';
export const PROXY_SERVICE_NAME = 'TradingView Desktop Proxy';

export async function getProxyLoginAndPassword(): Promise<Credentials | null> {
	const passwordManagerService = ipcMain ? passwordManagerServiceMain : passwordManagerServiceProxy;

	let credentials: Credentials[] | null = null;
	try {
		credentials = await passwordManagerService().getCredentialsByService(PROXY_SERVICE_NAME) ?? null;
	}
	catch (error) {
		loggerService().error(
			`getProxyLoginAndPassword(): passwordManagerService().getCredentialsByService(${ PROXY_SERVICE_NAME }) error`,
			error
		);
	}

	if (!credentials) {
		loggerService().warn(`getProxyLoginAndPassword(): no credentials were found for ${ PROXY_SERVICE_NAME }`);
		return null;
	}

	const account = credentials.find((credential) => credential.account === PROXY_SERVICE_ACCOUNT_NAME)?.password ?? '';
	const password = credentials.find((credential) => credential.account === PROXY_SERVICE_PASSWORD_NAME)?.password ?? '';

	return { account, password };
}
