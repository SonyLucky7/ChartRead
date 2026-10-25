import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shell } from '@electron/remote';
import { SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { ButtonColor, ButtonSize, ButtonVariant } from '@tradingview/ui-lib/buttons/types';
import { Checkbox } from '@tradingview/ui-lib/checkbox';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../../logger';
import { settingsProviderProxy } from '../../../../../services/settings';
import { ignorePromise } from '../../../../../utils';
import { useObservable } from '../../../../components-ui/hooks';
import { SettingsSection } from '../../settings-section';
import { useKeyDownHandler } from '../../use-keydown-handler';

import './file-download-section.css';

const DOWNLOAD_LOCATION_CHECKBOX_ID = 'downloadLocation';

const keyDownCheckboxActions: Record<string, RxJSNext<boolean>> = {
	[DOWNLOAD_LOCATION_CHECKBOX_ID]: settingsProviderProxy().showSelectFolderDialogChange.next,
};

export const FileDownloadSection = (): JSX.Element => {
	const { t } = useTranslation();

	const [isFileSavePathValid, setIsFileSavePathValid] = useState<boolean>(true);
	const [filePath, setFilePath] = useState<string>('');
	const [askDownloadPathEveryTime, setAskDownloadPathEveryTime] = useState<boolean>(false);

	const fileSavePathChangeHandler = (value: string): void => {
		setFilePath(value);

		const validate = async(): Promise<void> => {
			const isValid = await settingsProviderProxy().isFileSavePathValid();

			if (isFileSavePathValid !== isValid) {
				setIsFileSavePathValid(isValid);
			}
		};

		validate()
			.catch((error) => {
				loggerServiceProxy().error('<FileDownloadSection>.fileSavePathChangeHandler(): validate() error', error);
			});
	};

	useObservable<string>(settingsProviderProxy().fileSavePathChange, fileSavePathChangeHandler);
	useObservable<boolean>(settingsProviderProxy().showSelectFolderDialogChange, setAskDownloadPathEveryTime);

	useKeyDownHandler(keyDownCheckboxActions);

	const openDownloadFolder = (ev: React.MouseEvent): void => {
		ev.preventDefault();

		// TODO: use shell directly from electron when the bug is fixed: https://github.com/electron/electron/issues/36765
		shell.openPath(filePath)
			.catch((error) => {
				loggerServiceProxy().error('<FileDownloadSection>.openDownloadFolder(): shell.openPath() error', error);
			});
	};

	const toggleAskDownloadPathEveryTime = (): void => {
		settingsProviderProxy().showSelectFolderDialogChange.next(!askDownloadPathEveryTime);
	};

	return (
		<SettingsSection className='file-download' label={ t('DOWNLOADS') }>
			<div className="path-controls-container">
				{ /* TODO: use ui-lib Link component */ }
				<a
					className={ `path-button ${ askDownloadPathEveryTime ? 'disabled' : '' }` }
					onClick={ openDownloadFolder }
					id='openDownloadFolder'
					tabIndex={ 1 }
				>
					<Typography tag='span' name='typography-regular-14px'>
						{ filePath }
					</Typography>
				</a>

				<SquareButton
					size={ ButtonSize.Small }
					color={ ButtonColor.Gray }
					variant={ ButtonVariant.Secondary }
					onClick={ () => ignorePromise(settingsProviderProxy().changeFileSavePath()) }
					disabled={ askDownloadPathEveryTime }
					id='browseFileDownload'
					tabIndex={ 1 }
				>
					{ t('Change') }
				</SquareButton>
			</div>

			<Checkbox
				id={ DOWNLOAD_LOCATION_CHECKBOX_ID }
				checked={ askDownloadPathEveryTime }
				onChange={ toggleAskDownloadPathEveryTime }
				label={ t('Always ask where to save files') }
				tabIndex={ 1 }
			/>
		</SettingsSection>
	);
};
