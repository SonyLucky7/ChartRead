import React from 'react';
import { CircleProgressbar, CircleProgressbarIntent, CircleProgressbarSize } from '@tradingview/ui-lib/progressbar/circle-progressbar';

import './spinner.css';

export const Spinner = (): JSX.Element =>
	<div className="spinner-container" role="progressbar" >
		<CircleProgressbar intent={ CircleProgressbarIntent.neutral } size={ CircleProgressbarSize.Large } />
	</div>;
