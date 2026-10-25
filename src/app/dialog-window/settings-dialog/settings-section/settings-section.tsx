import React from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import './settings-section.css';

interface SettingsSectionProps {
	children: React.ReactNode;
	label: string;
	className?: string;
	contentRef?: React.RefObject<HTMLDivElement>;
}

export const SettingsSection = ({
	children,
	label,
	className = '',
	contentRef,
}: SettingsSectionProps): JSX.Element =>
	<section className={ `settings-section ${ className }` }>
		<Typography tag='label' name='typography-caps-11px'>{ label }</Typography>
		<div ref={ contentRef } className='settings-section-content'>
			{ children }
		</div>
	</section>;
