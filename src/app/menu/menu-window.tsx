import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALWAYS_DROPDOWN_POPOVER_BREAKPOINT } from '@tradingview/ui-lib/popovers/popover/breakpoints';
import {
	PopoverKeyboardNavigator,
} from '@tradingview/ui-lib/popovers/popover/popover-keyboard-navigator/popover-keyboard-navigator';
import { PlacementRule } from '@tradingview/ui-lib/popovers/positioners/anchor-positioner/types';
import {
	PLACEMENT_BOTTOM_ALIGN_LEFT,
	PLACEMENT_BOTTOM_ALIGN_RIGHT,
} from '@tradingview/ui-lib/popovers/positioners/placement-rule-presets';
import { NonEmptyArray } from '@tradingview/ui-lib/utils/non-empty-array';

import { MainMenuData, MenuType, TabMenuData, TabMenuSubmenuSide } from '../../services/window/menu-window-types';
import { isRtlRender } from '../../utils';
import { MenuItem } from './menu-item/menu-item';
import { MenuItemInfo } from './menu-item/menu-item-types';
import { getMenuItems, getTabMenuItems } from './menu-items';
import { useMenuWindow } from './use-menu-window';

import './menu-window.css';

function getMenuOffsetStyle(rendererData: TabMenuData | MainMenuData): React.CSSProperties {
	if (rendererData.type === MenuType.Tab) {
		if (rendererData.isInFullscreenOnWin) {
			return {
				left: rendererData.position.x,
				top: rendererData.position.y,
			};
		}

		return { top: rendererData.menuOffsetY };
	}

	return rendererData.isInFullscreenOnWin
		? { margin: '35px 4px 0 0' }
		: {};
}

export const Menu = (): JSX.Element => {
	const { t } = useTranslation();

	const { menuRef, anchorMenuRef, isReady, isVisible, rendererData } = useMenuWindow<TabMenuData | MainMenuData>();

	const [menuItems, setMenuItems] = useState<MenuItemInfo[]>([]);

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (rendererData.type === MenuType.Main) {
			setMenuItems(getMenuItems({ ...rendererData, t }));
		}

		if (rendererData.type === MenuType.Tab) {
			setMenuItems(getTabMenuItems({ ...rendererData, t }));
		}
	}, [rendererData, t, isReady]);

	if (!isVisible) {
		return <></>;
	}

	const isTabMenu = rendererData.type === MenuType.Tab;

	const offsetStyle = getMenuOffsetStyle(rendererData);

	// Anchor the base menu to the edge that matches its side: on the left side it is
	// right-anchored so it opens to the left of the click (mirror of the default right side).
	// The positioner inverts left/right alignment itself when `isRtl` is set (see inverseRule),
	// so we XOR the desired side with the direction to cancel that out and get the same visual
	// layout in both LTR and RTL.
	const isSubmenuOnLeft = isTabMenu && rendererData.submenuSide === TabMenuSubmenuSide.Left;
	const tabMenuPlacementRules: NonEmptyArray<PlacementRule> = [
		isSubmenuOnLeft !== isRtlRender()
			? PLACEMENT_BOTTOM_ALIGN_RIGHT
			: PLACEMENT_BOTTOM_ALIGN_LEFT,
	];

	const submenuSideClassName = isTabMenu ? `${ rendererData.submenuSide }` : '';

	return (
		<div className={ `menu-container ${ rendererData.type } ${ submenuSideClassName }` }>
			<div ref={ anchorMenuRef } style={ offsetStyle }>
				<PopoverKeyboardNavigator
					isOpen={ isReady }
					onClose={ () => {} }
					anchored={ {
						type: 'element',
						at: anchorMenuRef,
					} }
					placementRules={ isTabMenu ? tabMenuPlacementRules : undefined }
					refToContentWrapperElement={ menuRef }
					isRtl={ isRtlRender() }
					closeOnTab={ false }
					focusFirstItemOnOpen={ false }
					mobileBreakpoint={ ALWAYS_DROPDOWN_POPOVER_BREAKPOINT }
				>
					{ menuItems.map((item, index) =>
						<MenuItem { ...item } key={ index } />
					) }
				</PopoverKeyboardNavigator>
			</div>
		</div>
	);
};
