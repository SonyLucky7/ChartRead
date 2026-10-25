import React from 'react';

import { useTheme } from '../../../components-ui/hooks';

import SeparatorDark from './assets/separator-dark.svg';
import SeparatorLight from './assets/separator-light.svg';

import './separator.css';

export const Separator = (): JSX.Element => {
	const { platformTheme } = useTheme();

	return (
		<div className='new-tab-separator-container'>
			{ platformTheme === 'dark'
				? <SeparatorDark />
				: <SeparatorLight />
			}
		</div>
	);
};
