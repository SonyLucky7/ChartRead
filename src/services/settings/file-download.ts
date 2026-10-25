import { dialog } from 'electron';

import { loggerService } from '../../logger';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { appSettingsService } from '../app-settings-service';
import { windowService } from '../window';
import { settingsProvider } from '.';

export function changeFileSavePath(): void {
	loggerService().info('Settings : File save path change');
	const wnd = windowService().getLastFocusedWindow();

	if (!wnd) {
		return;
	}

	const defaultPath = appSettingsService().get('fileSaveDefaultPath');

	const filePath = dialog.showOpenDialogSync(wnd.windowRef, { defaultPath, properties: ['openDirectory'] });

	if (!filePath || filePath.length < 1) {
		return;
	}

	settingsProvider().fileSavePathChange.next(filePath[0]);
}

export function isFileSavePathValid(path: string): boolean {
	return FileSystemProvider.exists(path);
}
