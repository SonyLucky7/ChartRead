import React, { ComponentProps } from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import { getRendererInitialData } from '../common/app-common';
import { SplashData, SplashPostfix } from './promo-events';
import { VersionInfo } from './version-info';

import './splash.css';

interface SplashViewWindowData {
	splashData: SplashData;
}

// https://www.unicode.org/charts/nameslist/n_0080.html#00B7
const DOT_CHAR = '\u00b7';

const SplashTitleStyleMap = new Map<SplashPostfix, ComponentProps<typeof Typography>['name']>([
	[SplashPostfix.AstronautIce, 'typography-accent-adaptive-2xl-euclid-desktop'],
	[SplashPostfix.AstronautRover, 'typography-accent-adaptive-2xl-euclid-desktop'],
	[SplashPostfix.AstronautSunset, 'typography-accent-adaptive-2xl-euclid-desktop'],
	[SplashPostfix.FirstApril, 'typography-accent-adaptive-2xl-euclid-desktop'],
	[SplashPostfix.Halloween, 'typography-accent-adaptive-l-euclid-desktop'],
	[SplashPostfix.BlackFriday, 'typography-accent-adaptive-l-euclid-desktop'],
	[SplashPostfix.CyberMonday, 'typography-accent-adaptive-l-euclid-desktop'],
	[SplashPostfix.ChristmasHolidays, 'typography-accent-adaptive-2xl-euclid-desktop'],
	[SplashPostfix.NewYear, 'typography-accent-adaptive-l-euclid-desktop'],
]);

export const Splash = (): JSX.Element => {
	const { splashData } = getRendererInitialData<SplashViewWindowData>();

	return (
		<div className={ `splash ${ splashData.postfix }` }>
			<div className='splash-content'>
				<Typography
					tag='span'
					name={ SplashTitleStyleMap.get(splashData.postfix) ?? 'typography-regular-24px' }
					className='splash-title splash-half-typography'
				>
					{ splashData.title }
					{ splashData.eventTitle &&
							<>
								{ ` ${ DOT_CHAR } ` }
								<span className='splash-event-title'>{ splashData.eventTitle }</span>
							</>
					}
				</Typography>

				<VersionInfo />
			</div>
		</div>
	);
};
