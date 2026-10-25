import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import BoxWithPlanets from './assets/box-with-planets.svg';

import './no-product-selected.css';

interface NoProductSelectedProps {
	onClick(): void;
}

export const NoProductSelected = ({ onClick }: NoProductSelectedProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className='no-product-selected'>
			<BoxWithPlanets />
			<Typography
				tag='h2'
				name='typography-accent-24px-bold'
			>
				{ t('You haven\'t selected any tools yet') }
			</Typography>
			<Typography
				tag='p'
				name='typography-regular-16px'
			>
				{ t('Pick your favorites to build your ideal workspace.') }
			</Typography>
			<SquareButton
				onClick={ onClick }
				color={ ButtonColor.Black }
				variant={ ButtonVariant.Primary }
				size={ ButtonSize.Large }
				className='no-product-selected-button'
			>
				{ t('Add tools') }
			</SquareButton>
		</div>
	);
};
