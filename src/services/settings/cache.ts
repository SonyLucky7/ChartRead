import { session } from 'electron';

import { loggerService } from '../../logger';
import { sessionStorageService } from '../../main/session-storage';
import { persistenceService } from '../../persistence';
import { ignorePromise } from '../../utils';
import { DOMAINS } from '../interfaces';
import { passwordManagerService } from '../password-manager';
import { themeManager } from './theme';

export async function clearAppCookies(): Promise<void> {
	const cookies = await session.defaultSession.cookies.get({});

	cookies.forEach(cookie => {
		if (cookie.domain && !DOMAINS.includes(cookie.domain)) {
			ignorePromise(session.defaultSession.cookies.remove(
				cookie.domain.startsWith('.')
					? `http://www${ cookie.domain }`
					: `https://${ cookie.domain }`, cookie.name));
		}
	});
}

export async function clearAppCache(): Promise<void> {
	return session.defaultSession.clearCache();
}

export async function clearAppCacheAndCookies(): Promise<void> {
	loggerService().info('Settings: Clear app cache and brokers cookies');

	sessionStorageService().scheduleFullCleanupAtDispose();
	try {
		await clearAppCache();
	}
	catch (error) {
		loggerService().error('Clear cache error occurred', error);
	}

	try {
		await clearAppCookies();
	}
	catch (err) {
		loggerService().error('Clear brokers cookies error', err);
	}
}

export async function clearData(): Promise<void> {
	await session.defaultSession.setProxy({
		proxyRules: undefined,
	});
	await persistenceService().clearUserStorage();
	await session.defaultSession.clearCache();
	await session.defaultSession.clearAuthCache();
	await session.defaultSession.clearStorageData();
	await passwordManagerService().deleteCredentials();
	await themeManager().setPlatformTheme();
}
