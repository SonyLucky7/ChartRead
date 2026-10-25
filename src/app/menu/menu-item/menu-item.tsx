import React from 'react';
import { CustomPopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/custom-popover-item/custom-popover-item';
import { DividerPopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/divider-popover-item/divider-popover-item';
import {
	NestedPopoverPopoverItem,
} from '@tradingview/ui-lib/popovers/popover/popover-items/nested-popover-popover-item/nested-popover-popover-item';
import { PopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/popover-item/popover-item';
import { SectionPopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/section-popover-item/section-popover-item';

import { loggerServiceProxy } from '../../../logger';
import { getArrowKeyboardNavigationDataAttributes } from '../../common/arrow-keyboard-navigation-data-attributes';
import { HorizontalNavigationItem } from './horizontal-navigation-item/horizontal-navigation-item';
import { MenuItemInfo, MenuItemType } from './menu-item-types';

import './menu-item.css';

export const MenuItem = (item: MenuItemInfo): JSX.Element => {
	switch (item.type) {
		case MenuItemType.Empty: {
			return <></>;
		}

		case MenuItemType.Separator: {
			return <DividerPopoverItem />;
		}

		case MenuItemType.Custom: {
			const Wrapper = item.hasHorizontalNavigation ? HorizontalNavigationItem : React.Fragment;

			return (
				<Wrapper>
					<CustomPopoverItem focusable={ item.focusable }>
						{ item.children }
					</CustomPopoverItem>
				</Wrapper>
			);
		}

		case MenuItemType.Section: {
			const { title, items } = item;

			return (
				<>
					<DividerPopoverItem />
					<SectionPopoverItem title={ title }>
						{ items.map((currentItem, index) =>
							<MenuItem { ...currentItem } key={ index } />
						) }
					</SectionPopoverItem>
				</>
			);
		}

		case MenuItemType.Nested: {
			const { children, ...currentItem } = item;

			return (
				<NestedPopoverPopoverItem
					{ ...currentItem }
					nestedPopoverRole='menu'
				>
					{ children }
				</NestedPopoverPopoverItem>
			);
		}

		default: {
			const {
				onClick,
				...currentItem
			} = item;

			const handleClick = (ev: React.MouseEvent | React.KeyboardEvent): void => {
				ev.preventDefault();
				ev.stopPropagation();

				onClick?.()
					?.catch((error) => {
						loggerServiceProxy().error('<MenuItem>.handleClick(): onClick() error', error);
					});
			};

			return (
				<PopoverItem
					{ ...currentItem }
					{ ...getArrowKeyboardNavigationDataAttributes(!currentItem.disabled) }
					tabIndex={ currentItem.disabled ? -1 : 0 }
					onClick={ handleClick }
				/>
			);
		}
	}
};
