import { DownloadItem } from 'electron';
import i18next from 'i18next';
import { dirname, extname, join } from 'path';
import { ButtonColor, ButtonVariant } from '@tradingview/ui-lib/buttons/types';

import { loggerService } from '../logger';
import { FileSystemProvider } from '../providers/file-system-provider';
import { getUID } from '../tvd-runtime/core';
import { isDarwin } from '../utils';
import { checkPathFileSavePermission } from '../utils/os-utils';
import { appSettingsService } from './app-settings-service';
import { settingsProvider } from './settings';
import { windowService } from './window';
import { DialogWindow } from './window/dialog-window';
import { ToastRendererType } from './window/toast';
import { toastService } from './window/toast-service';
import { CommonDialogData, DialogActionType } from './window/window-api';

interface FileMetadata {
	filePath: string;
	fileExtension: string;
}

const UID_LENGTH = 5;

let defaultSaveFolder = appSettingsService().get('fileSaveDefaultPath');
let sessionSaveFolder = '';

export function fileDownloadListener(ev: Electron.Event, item: Electron.DownloadItem, webContents: Electron.WebContents): void {
	loggerService().debug('Electron.Session (will-download)');

	const parentWindow = windowService().findWindow({ tabWebContents: webContents });

	if (!parentWindow) {
		loggerService().error('Electron.Session (will-download) Parent window destroyed');
		return;
	}

	const isShowFolderSelectDialog = appSettingsService().get('showFolderSelectDialog');
	const currentFolder = getCurrentSaveFolder(isShowFolderSelectDialog);
	const { filePath, fileExtension } = getFileInformation(currentFolder, item);
	const isCurrentFolderExist = FileSystemProvider.exists(currentFolder);
	const isCurrentFolderHavePermissionForFileSave = checkPathFileSavePermission(filePath);

	if (isShowFolderSelectDialog || !isCurrentFolderExist || !isCurrentFolderHavePermissionForFileSave) {
		// mime type for .webm not set and defaults to text/plain
		const filterName = fileExtension === 'webm' ? 'Video' : item.getMimeType().split('/')[0];

		item.setSaveDialogOptions({
			defaultPath: filePath,
			filters: [
				{ name: capitalize(filterName), extensions: [fileExtension] },
				{ name: 'All Files', extensions: ['*'] },
			],
		});
	}
	else {
		item.setSavePath(filePath);
	}

	const handleFail = (state: string): void => {
		loggerService().error(`[fileDownloadListener()] File download failed for ${ item.getFilename() }. Reason: ${ state }`);

		const failText = state === 'interrupted'
			? i18next.t('File export was interrupted')
			: i18next.t('File export was cancelled');

		const dialogData = new CommonDialogData(
			i18next.t('Export failed'),
			failText,
			[{
				id: DialogActionType.Ok,
				text: i18next.t('Ok'),
				color: ButtonColor.Black,
				variant: ButtonVariant.Primary,
			}]
		);

		DialogWindow.showDialogWindow({
			isModal: isDarwin(),
			data: dialogData,
			size: { height: 170, width: 480 },
			parentWindow: parentWindow?.windowRef,
			closeOnSubmit: true,
		}).catch(err => loggerService().error('[fileDownloadListener()] Error at showing file download failure dialog', err));
	};

	const handleSuccess = (): void => {
		loggerService().info(`[fileDownloadListener()] File download succeded for file ${ item.getSavePath() }`);

		toastService().show(
			{
				rendererType: ToastRendererType.Download,
				message: {
					text: `${ i18next.t('File downloaded') }`,
				},
			},
			parentWindow.windowRef
		)
			.catch((error) => {
				loggerService().error('fileDownloadListener(): toastService().show() error', error);
			});
	};

	item.on('updated', (updatedEv, state) => {
		if (state === 'interrupted') {
			handleFail(state);
		}
	});

	item.once('done', (doneEv, state) => {
		if (state === 'completed') {
			const savedFilePath = item.getSavePath();
			const newDefaultFolder = dirname(savedFilePath);

			if (newDefaultFolder !== savedFilePath) {
				sessionSaveFolder = newDefaultFolder;

				if (!isShowFolderSelectDialog) {
					defaultSaveFolder = newDefaultFolder;

					appSettingsService().set('fileSaveDefaultPath', defaultSaveFolder);
					settingsProvider().fileSavePathChange.next(defaultSaveFolder);
				}
			}

			handleSuccess();
		}
		else {
			handleFail(state);
		}
	});
}

function capitalize(str: string): string {
	return str.charAt(0).toLocaleUpperCase() + str.substr(1);
}

function getCurrentSaveFolder(isShowFolderSelectDialog: boolean): string {
	const currentDefaultSavePath = appSettingsService().get('fileSaveDefaultPath');

	if (!sessionSaveFolder) {
		sessionSaveFolder = defaultSaveFolder;
	}

	if (currentDefaultSavePath !== defaultSaveFolder) {
		defaultSaveFolder = currentDefaultSavePath;
		sessionSaveFolder = defaultSaveFolder;
	}

	return isShowFolderSelectDialog ? sessionSaveFolder : defaultSaveFolder;
}

function getUniqueFileName(folderPath: string, filename: string, fileExtension: string): string {
	while (true) {
		const fileNameWithoutExtension = filename.substring(0, filename.lastIndexOf(`.${ fileExtension }`));
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const uniqueFileName = `${ fileNameWithoutExtension }_${ getUID().slice(0, UID_LENGTH) }.${ fileExtension }`;

		if (!FileSystemProvider.exists(join(folderPath, uniqueFileName))) {
			return uniqueFileName;
		}
	}
}

function getFileInformation(currentFolder: string, item: DownloadItem): FileMetadata {
	// sufficient  full filename length to safely save the downloading file
	const maxFullFilenameLength = 214;

	// -2 - because '.' char and '_' char includes in full name of file
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const maxFilenameLength = maxFullFilenameLength - UID_LENGTH - 2;

	const fullFileName = item.getFilename();
	const fileExtension = extname(fullFileName).replace('.', '');

	let fileName = fullFileName;

	if (fullFileName.length > maxFilenameLength) {
		fileName = `${ fullFileName.slice(0, maxFilenameLength - fileExtension.length) }.${ fileExtension }`;
	}

	const uniqueFileName = getUniqueFileName(currentFolder, fileName, fileExtension);

	const filePath = join(currentFolder, uniqueFileName);

	return {
		filePath,
		fileExtension,
	};
}
