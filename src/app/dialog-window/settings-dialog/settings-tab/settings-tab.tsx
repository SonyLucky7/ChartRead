import React from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import './settings-tab.css';

interface SettingsTabProps {
	icon: React.ReactNode;
	onClick(): void;
	selected: boolean;
	title: string;
	dataCategory?: string;
	tabIndex?: number;
}

export const SettingsTab = React.memo(
	({
		icon,
		onClick,
		selected,
		title,
		dataCategory = '',
		tabIndex = -1,
	}: SettingsTabProps): JSX.Element =>
		<button
			className={ `tab ${ selected ? 'selected' : '' }` }
			tabIndex={ tabIndex }
			data-category={ dataCategory }
			onClick={ onClick }
		>
			<span className='tab-icon'>{ icon }</span>
			<Typography
				tag='span'
				name={ selected ? 'typography-accent-14px-semibold' : 'typography-regular-14px' }
			>
				{ title }
			</Typography>
		</button>
);
