import React, { useEffect } from 'react';
import { Snackbar } from '@tradingview/ui-lib/snackbar/snackbar/snackbar';
import { Typography } from '@tradingview/ui-lib/typography';

import { setupI18nLocaleHandler } from '../../../services/locale';
import { FullscreenToast } from '../../../services/window/toast';
import { notifyViewReady } from '../../common/app-common';
import { ToastViewProps } from '../../renderer-services';

import './fullscreen-toast.css';

export default ({ toastView }: ToastViewProps<FullscreenToast>): JSX.Element => {
	useEffect(() => {
		setupI18nLocaleHandler();
		notifyViewReady();
	}, []);

	const [textPartBeforeKey, textPartAfterKey] = toastView.toast.message.text.split(toastView.toast.message.key);

	return (
		<Snackbar>
			<div className='fullscreen-toast-container'>
				{ textPartBeforeKey.trim() }
				<Typography tag='span' name='typography-accent-12px-semibold' className="fullscreen-toast-part-key" >
					{ toastView.toast.message.key }
				</Typography>
				{ textPartAfterKey.trim() }
			</div>
		</Snackbar>
	);
};
