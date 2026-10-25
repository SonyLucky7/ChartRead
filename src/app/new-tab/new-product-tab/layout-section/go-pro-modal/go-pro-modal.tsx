import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { useTVHost } from '../../../../components-ui/hooks';
import { withPortal } from '../../../hocs';
import { ModalWindowWithVideo } from '../modal-window-with-video';

import NewProductTabVideo from './assets/new-product-tab.webm';

import './go-pro-modal.css';

interface GoProModalProps {
	onCancel(): void;
}

export const GoProModal = withPortal(({ onCancel }: GoProModalProps): JSX.Element => {
	const { t } = useTranslation();

	const { tvHost } = useTVHost();

	const handleClick = (): void => {
		window.open(`${ tvHost }pricing/`);
	};
	// eslint-disable-next-line max-len
	const subtitle = t('Ah. You\'ve reached the limit of saved chart layouts in your plan. But no stress, our upgraded plans let you save multiple layouts, up to an unlimited amount - perfect if you want to revisit your market analysis at a moment\'s notice.');

	return (
		<ModalWindowWithVideo onCancel={ onCancel } videoSource={ NewProductTabVideo }>
			<div className='go-pro-modal-text'>
				<Typography
					tag='h2'
					name='typography-accent-adaptive-2xs-semibold-desktop'
					className='go-pro-modal-title'
				>
					{ t('Increase your chart layout limit') }
				</Typography>
				<Typography tag='p' name='typography-regular-18px' className='go-pro-modal-subtitle'>
					{ subtitle }
				</Typography>
			</div>

			{ /* TODO: implement when DRG-722 is ready */ }
			{ /* <div className='go-pro-modal-plan-slider'></div> */ }

			<SquareButton
				onClick={ handleClick }
				variant={ ButtonVariant.Primary }
				color={ ButtonColor.Brand }
				size={ ButtonSize.XLarge }
				className='go-pro-modal-button'
			>
				{ t('Upgrade now') }
			</SquareButton>
		</ModalWindowWithVideo>
	);
});
