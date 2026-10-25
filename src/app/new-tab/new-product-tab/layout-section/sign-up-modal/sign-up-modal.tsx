import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { newTabServiceProxy } from '../../../../../services/new-tab';
import { withPortal } from '../../../hocs';
import { ModalWindowWithVideo } from '../modal-window-with-video';

import NewWindowVideo from './assets/new-window.webm';

import './sign-up-modal.css';

interface SignUpModalProps {
	onCancel(): void;
}

export const SignUpModal = withPortal(({ onCancel }: SignUpModalProps): JSX.Element => {
	const { t } = useTranslation();

	const handleSignUpClick = (): void => {
		onCancel();

		newTabServiceProxy().showSignInDialog();
	};

	// eslint-disable-next-line max-len
	const subtitle = t('With our free account you can open as many windows as you like and get the most out of your multi-monitor setup. Don\'t have an account yet? Click the button below to get started and start working with multiple windows.');

	return (
		<ModalWindowWithVideo onCancel={ onCancel } videoSource={ NewWindowVideo }>
			<div className='sign-up-modal-text'>
				<Typography
					tag='h2'
					name='typography-accent-adaptive-2xs-semibold-desktop'
					className='sign-up-modal-title'
				>
					{ t('More windows mean more options.') }
				</Typography>
				<Typography tag='p' name='typography-regular-18px' className='sign-up-modal-subtitle'>
					{ subtitle }
				</Typography>
			</div>

			<SquareButton
				onClick={ handleSignUpClick }
				variant={ ButtonVariant.Primary }
				color={ ButtonColor.Brand }
				size={ ButtonSize.XLarge }
				className='sign-up-modal-button'
			>
				{ t('Sign up for free') }
			</SquareButton>
		</ModalWindowWithVideo>
	);
});
