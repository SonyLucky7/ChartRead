import React from 'react';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { Typography } from '@tradingview/ui-lib/typography';

import { Separator as SeparatorMenuItem } from './separator';

import './context-menu-item.css';

export const enum ContextMenuItemType {
	Empty = 'empty',
	Separator = 'separator',
	Common = 'common',
}

export interface ContextMenuItemInfo {
	type: ContextMenuItemType;
	icon?: string;
	onClick?(): void;
	title?: string;
}

interface ContextMenuItemProps extends ContextMenuItemInfo {}

export const ContextMenuItem = ({
	type = ContextMenuItemType.Empty,
	icon,
	onClick,
	title,
}: ContextMenuItemProps): JSX.Element => {
	if (type === ContextMenuItemType.Empty) {
		return <></>;
	}

	if (type === ContextMenuItemType.Separator) {
		return <SeparatorMenuItem />;
	}

	return (
		<li className='context-menu-item'>
			<button className='context-menu-item-button' onClick={ onClick }>
				{ icon && <BlockIcon icon={ icon } /> }
				<Typography tag='span' name='typography-regular-14px'>
					{ title }
				</Typography>
			</button>
		</li>
	);
};
