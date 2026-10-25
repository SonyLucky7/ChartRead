import React from 'react';
import { useTranslation } from 'react-i18next';

import BadConnection from './assets/bad-connection.svg';
import OrangeDot from './assets/orange-dot.svg';

import './bad-connection-indicator.css';

export const BadConnectionIndicator = (): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div
			className='bad-connection-icon-wrapper'
			title={ t('Poor signal means delays. Leave the woodland for flawless updates.') }
		>
			<div className='bad-connection-icon'>
				<BadConnection />
			</div>
			<div className='blinking-dot'>
				<OrangeDot />
			</div>
		</div>
	);
};
