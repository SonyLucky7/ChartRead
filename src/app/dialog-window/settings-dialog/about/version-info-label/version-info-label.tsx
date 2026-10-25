import React from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import { getRendererInitialData } from '../../../../common/app-common';
import { SettingsWindowData } from '../../settings-dialog';

import TVLogo from '../../../../assets/tv-logo.svg';

import './version-info-label.css';

// https://www.unicode.org/charts/nameslist/n_0080.html#00B7
const dotChar = '\u00b7';

export const VersionInfoLabelComponent = (): JSX.Element => {
	const { buildInfo } = getRendererInitialData<SettingsWindowData>();

	return (
		<div className='version-info-label'>
			<div className='logo-container'><TVLogo /></div>
			<div className='version-info'>
				<Typography tag='h2' name='typography-accent-18px-semibold'>TradingView</Typography>
				<Typography tag='p' name='typography-regular-14px'>
					{ `Version ${ buildInfo.appVersion } ${ dotChar } ${ new Date(buildInfo.buildDate).toLocaleDateString() }` }
				</Typography>
			</div>
		</div>
	);
};
