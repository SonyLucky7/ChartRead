import React from 'react';

import { Position } from '../../../../utils';
import { getBlocksHotkeysDataAttributes } from '../../../components-ui/hooks/use-hotkeys';
import { withPortal } from '../../hocs';
import { ContextMenuItem, ContextMenuItemInfo } from './context-menu-item';

import './context-menu.css';

interface ContextMenuProps {
	menuItems: ContextMenuItemInfo[];
	position: Position;
	visibility: 'hidden' | 'visible';
	className?: string;
	menuRef?: React.RefObject<HTMLUListElement>;
}

export const ContextMenu = withPortal(({
	menuItems,
	position,
	visibility,
	className = '',
	menuRef,
}: ContextMenuProps): JSX.Element =>
	<ul
		ref={ menuRef }
		className={ `context-menu ${ className }` }
		style={ { left: `${ position.x }px`, top: `${ position.y }px`, visibility } }
		{ ...getBlocksHotkeysDataAttributes() }
	>
		{ menuItems.map((item, index) =>
			<ContextMenuItem key={ item.title ?? index } { ...item } />
		) }
	</ul>
);
