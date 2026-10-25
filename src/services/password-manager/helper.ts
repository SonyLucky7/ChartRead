import { BrowserWindow } from 'electron';

import { loggerService } from '../../logger';
import { askCredentialsSave } from '../../utils/dialog-window-helper';
import { CredentialsInputSnapshot } from '../window/window-api';
import { Credentials } from './ipassword-manager-service';
import { passwordManagerService } from '.';

export async function setCredentialsHandler(enteredCredentials: Credentials, window: BrowserWindow | undefined): Promise<void> {
	if (enteredCredentials.account === '' || enteredCredentials.password === '') {
		return;
	}

	try {
		const inputData = await askCredentialsSave(enteredCredentials, window);

		if (inputData?.button !== 1) {
			return;
		}

		const credentials = (inputData.input as CredentialsInputSnapshot).credentials;

		if (credentials) {
			passwordManagerService().setPassword(credentials.account, credentials.password);
		}
	}
	catch (err) {
		loggerService().error('Set credentials error', err);
	}
}
