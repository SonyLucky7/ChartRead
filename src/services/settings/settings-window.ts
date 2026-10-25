import { BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main';

import { loggerService } from '../../logger';
import { getBuildInfo } from '../../utils/build-info';
import { DialogWindow } from '../window/dialog-window';
import { SettingsDialogData } from '../window/window-api';
import { SettingsWindowOptions } from './settings-tabs';
import { settingsProvider } from '.';

let settingsWindow__: DialogWindow | undefined;
let isInAttemptToOpenSettings = false;

export async function showSettingsWindow(wnd?: BrowserWindow, options?: SettingsWindowOptions): Promise<void> {
	if (isInAttemptToOpenSettings) {
		return;
	}

	if (!settingsWindow__ || settingsWindow__.windowRef.isDestroyed()) {
		isInAttemptToOpenSettings = true;

		try {
			settingsWindow__ = await createSettingsWindow(wnd, options);
		}
		finally {
			isInAttemptToOpenSettings = false;
		}

		return;
	}

	settingsWindow__.changeParent(wnd ?? null);
	settingsWindow__.show();
}

export function isSettingsWindowShown(): boolean {
	return !!settingsWindow__ && !settingsWindow__.windowRef.isDestroyed();
}

export function closeSettingsWindow(): void {
	if (!settingsWindow__ || settingsWindow__.windowRef.isDestroyed()) {
		loggerService().error('Calling closeSettingsWindow on window that not exists');
		return;
	}

	settingsWindow__.closeDialogWindow();
}

async function createSettingsWindow(
	wnd?: BrowserWindow,
	options?: SettingsWindowOptions,
): Promise<DialogWindow> {
	const buildInfo = await getBuildInfo();

	const settingsWindow = await DialogWindow.createDialogWindow({
		data: new SettingsDialogData(),
		size: { width: 633, height: 650 },
		isModal: false,
		parentWindow: wnd,
		closeOnSubmit: true,
		closeOnBlur: false,
		currentActiveTab: options?.currentActiveTab ?? settingsProvider().currentActiveTab,
		buildInfo,
	});
	enable(settingsWindow.windowRef.webContents);

	settingsWindow.windowRef.once('close', () => {
		settingsWindow.closeDialogWindow();
	});

	return settingsWindow;
}
