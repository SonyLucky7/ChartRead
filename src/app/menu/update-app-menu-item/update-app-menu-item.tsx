import React from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import './update-app-menu-item.css';

export const enum UpdateAppMenuItemType {
	Available = 'available',
	Warning = 'warning',
}

interface UpdateAppMenuItemProps {
	onClick(ev: React.MouseEvent<HTMLButtonElement>): void;
	icon: React.ReactNode;
	text: string;
	type: UpdateAppMenuItemType;
}

export const UpdateAppMenuItem = ({ onClick, icon, text, type }: UpdateAppMenuItemProps): JSX.Element => {
	return (
		<button onClick={ onClick } className={ `update-app-menu-item ${ type }` }>
			{ icon }
			<Typography tag='span' name='typography-regular-14px' >
				{ text }
			</Typography>
		</button>
	);
};
