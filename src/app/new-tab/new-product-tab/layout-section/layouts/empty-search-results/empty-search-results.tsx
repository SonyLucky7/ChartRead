import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import EmptySearchImage from './assets/ghost.svg';

import './empty-search-results.css';

interface EmptySearchResultProps {
	onClick(): void;
}

export const EmptySearchResult = ({ onClick }: EmptySearchResultProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className='empty-search-results'>
			<EmptySearchImage />

			<Typography tag='h3' name='typography-regular-16px' className='empty-search-results-title'>
				{ t('No charts match your criteria') }
			</Typography>

			<SquareButton
				onClick={ onClick }
				variant={ ButtonVariant.Primary }
				color={ ButtonColor.Black }
				size={ ButtonSize.Small }
			>
				{ t('Return to my layouts') }
			</SquareButton>
		</div>
	);
};
