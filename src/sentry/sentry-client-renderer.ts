import { ipcMain } from 'electron';
import { init as initSentry } from '@sentry/electron/renderer';

const isMainProcess = typeof ipcMain !== 'undefined';

export function initSentryRenderer(): void {
	if (isMainProcess) {
		throw new Error('This initialization must be called from renderer process');
	}

	initSentry();
}
