import React from 'react';
import { ALWAYS_DROPDOWN_POPOVER_BREAKPOINT } from '@tradingview/ui-lib/popovers/popover/breakpoints';
import {
	PopoverKeyboardNavigator,
} from '@tradingview/ui-lib/popovers/popover/popover-keyboard-navigator/popover-keyboard-navigator';

import { TabGroupMenuData } from '../../services/window/menu-window-types';
import { isRtlRender } from '../../utils';
import { MenuItem } from './menu-item/menu-item';
import { getTabGroupMenuItems } from './menu-items';
import { useMenuWindow } from './use-menu-window';

import './menu-window.css';

export const TabGroupMenu = (): JSX.Element => {
	const { menuRef, anchorMenuRef, isReady, isVisible, rendererData, close } = useMenuWindow<TabGroupMenuData>();

	if (!isVisible) {
		return <></>;
	}

	const items = getTabGroupMenuItems({ onGroupClick: close });

	const style: React.CSSProperties = rendererData.isInFullscreenOnWin
		? {
			margin: `${ rendererData.position.y }px 0 0 ${ rendererData.position.x }px`,
		}
		: {};

	return (
		<div className={ `menu-container ${ rendererData.type }` }>
			<div ref={ anchorMenuRef } style={ style }>
				<PopoverKeyboardNavigator
					isOpen={ isReady }
					onClose={ () => {} }
					anchored={ {
						type: 'element',
						at: anchorMenuRef,
					} }
					refToContentWrapperElement={ menuRef }
					isRtl={ isRtlRender() }
					closeOnTab={ false }
					focusFirstItemOnOpen={ false }
					mobileBreakpoint={ ALWAYS_DROPDOWN_POPOVER_BREAKPOINT }
				>
					{ items.map((item, index) =>
						<MenuItem { ...item } key={ index } />
					) }
				</PopoverKeyboardNavigator>
			</div>
		</div>
	);
};
