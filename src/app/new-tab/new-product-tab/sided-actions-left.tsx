import React from 'react';

import { TokyoNightButton } from '../sided-actions/tokyo-night-button';
import { ElementPosition, ElementPositioner } from './element-positioner';

import './sided-actions.css';

export const SidedActionsLeft = (): JSX.Element => {
	return (
		<ElementPositioner position={ ElementPosition.Left }>
			<div className='sided-actions-container'>
				<TokyoNightButton />
			</div>
		</ElementPositioner>
	);
};
