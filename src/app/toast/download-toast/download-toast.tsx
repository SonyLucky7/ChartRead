import React from 'react';
import { useTranslation } from 'react-i18next';
import { shell } from '@electron/remote';
import { Icon } from '@tradingview/ui-lib/icon';
import { svgIconcheckSize28pxStroke1pxTypeStroke as checkSvgIcon } from '@tradingview/ui-lib/icons/monochrome/check/size_28px__stroke_1px__type_stroke';
import { Snackbar } from '@tradingview/ui-lib/snackbar/snackbar/snackbar';
import { SnackbarButton } from '@tradingview/ui-lib/snackbar/snackbar-button/snackbar-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../logger';
import { settingsProviderProxy } from '../../../services/settings';
import { DownloadToast, ToastRendererType } from '../../../services/window/toast';
import { toastServiceProxy } from '../../../services/window/toast-service';
import { ToastViewProps } from '../../renderer-services';

import './download-toast.css';

export default (props: ToastViewProps<DownloadToast>): JSX.Element => {
	const { t } = useTranslation();

	const onToastClick = (): void => {
		settingsProviderProxy().getFileSavePath()
			// TODO: use shell directly from electron when the bug is fixed: https://github.com/electron/electron/issues/36765
			.then(downloadPath => shell.openPath(downloadPath))
			.then(() => toastServiceProxy().hide(ToastRendererType.Download))
			.catch(error => loggerServiceProxy().error('<DownloadToast>.onToastClick()', error));
	};

	return (
		<Snackbar>
			<div className='download-toast-container'>
				<Icon icon={ checkSvgIcon } className='ui-lib-icon download-toast-icon'/>
				<Typography name='typography-regular-14px' tag='span'>
					{ props.toastView.toast.message.text }
				</Typography>
				<div className='download-toast-button'>
					<SnackbarButton onClick={ onToastClick }>
						{ `${ t('Show in folder') }` }
					</SnackbarButton>
				</div>
			</div>
		</Snackbar>
	);
};
