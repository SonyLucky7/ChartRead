import { TFunction } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, RoundButton } from '@tradingview/ui-lib/buttons/round-button';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconsortSize28pxStroke1pxTypeSortDown as sortDownSvgIcon } from '@tradingview/ui-lib/icons/monochrome/sort/size_28px__stroke_1px__type_sort-down';
import { svgIconsortSize28pxStroke1pxTypeSortUp as sortUpSvgIcon } from '@tradingview/ui-lib/icons/monochrome/sort/size_28px__stroke_1px__type_sort-up';
import { PopoverItem, PopoverItemProps } from '@tradingview/ui-lib/popovers/popover/popover-items/popover-item/popover-item';
import { PopoverKeyboardNavigator } from '@tradingview/ui-lib/popovers/popover/popover-keyboard-navigator/popover-keyboard-navigator';

import { SortDirection, SortField } from '../../../../../../services/new-tab';
import { MenuCloseEventSource } from '../../../../../../services/window/window-api';
import { getWindowControl } from '../../../../../common/app-common';
import { useObservable, useOutsideClick } from '../../../../../components-ui/hooks';
import { getBlocksHotkeysDataAttributes } from '../../../../../components-ui/hooks/use-hotkeys';

import './sort-layouts-button.css';

interface GetMenuItemsOptions {
	t: TFunction;
	sortDirection: SortDirection;
	sortField: SortField;
	handleSortSelect(newSortField: SortField, newSortDirection: SortDirection): void;
	onClose(): void;
}

interface SortLayoutsButtonProps {
	sortDirection: SortDirection;
	sortField: SortField;
	handleSortSelect(newSortField: SortField, newSortDirection: SortDirection): void;
}

interface MenuItem extends Pick<PopoverItemProps, 'leftSlot' | 'title' | 'onClick' | 'selected'> {}

function getMenuItems({
	t,
	sortDirection,
	sortField,
	handleSortSelect,
	onClose,
}: GetMenuItemsOptions): MenuItem[] {
	const sortAtoZ: MenuItem = {
		leftSlot: <BlockIcon icon={ sortUpSvgIcon } />,
		title: t('Layout name (A to Z)'),
		onClick: () => {
			handleSortSelect(SortField.Title, SortDirection.Asc);
			onClose();
		},
		selected: sortDirection === SortDirection.Asc && sortField === SortField.Title,
	};

	const sortZtoA: MenuItem = {
		leftSlot: <BlockIcon icon={ sortDownSvgIcon } />,
		title: t('Layout name (Z to A)'),
		onClick: () => {
			handleSortSelect(SortField.Title, SortDirection.Desc);
			onClose();
		},
		selected: sortDirection === SortDirection.Desc && sortField === SortField.Title,
	};

	const sortOldestFirst: MenuItem = {
		leftSlot: <BlockIcon icon={ sortUpSvgIcon } />,
		title: t('Date modified (oldest first)'),
		onClick: () => {
			handleSortSelect(SortField.Modified, SortDirection.Asc);
			onClose();
		},
		selected: sortDirection === SortDirection.Asc && sortField === SortField.Modified,
	};

	const sortNewestFirst: MenuItem = {
		leftSlot: <BlockIcon icon={ sortDownSvgIcon } />,
		title: t('Date modified (newest first)'),
		onClick: () => {
			handleSortSelect(SortField.Modified, SortDirection.Desc);
			onClose();
		},
		selected: sortDirection === SortDirection.Desc && sortField === SortField.Modified,
	};

	return [
		sortAtoZ,
		sortZtoA,
		sortOldestFirst,
		sortNewestFirst,
	];
}

export const SortLayoutsButton = ({ handleSortSelect, sortDirection, sortField }: SortLayoutsButtonProps): JSX.Element => {
	const { t } = useTranslation();

	const sortLayoutsButtonRef = useRef<HTMLButtonElement>(null);
	const sortLayoutsMenuRef = useRef<HTMLDivElement>(null);

	const [isMenuOpened, setIsMenuOpened] = useState<boolean>(false);
	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

	const resetMenu = (): void => {
		setIsMenuOpened(false);
	};

	useOutsideClick<HTMLDivElement>(
		sortLayoutsMenuRef,
		isMenuOpened,
		resetMenu,
		{
			escape: true,
			scroll: true,
			resize: true,
		}
	);

	useEffect(() => {
		setMenuItems(
			getMenuItems({
				t,
				sortDirection,
				sortField,
				handleSortSelect,
				onClose: resetMenu,
			})
		);
	}, [handleSortSelect, sortDirection, sortField, t]);

	useObservable<MenuCloseEventSource>(getWindowControl().menuCloseEvent, resetMenu);

	return (
		<>
			<RoundButton
				color={ ButtonColor.Gray }
				size={ ButtonSize.Medium }
				variant={ ButtonVariant.Secondary }
				onClick={ () => { setIsMenuOpened(true); } }
				className='sort-layouts-button'
				reference={ sortLayoutsButtonRef }
			>
				<BlockIcon
					icon={ sortDirection === SortDirection.Asc ? sortUpSvgIcon : sortDownSvgIcon }
				/>
			</RoundButton>

			<PopoverKeyboardNavigator
				isOpen={ isMenuOpened }
				onClose={ () => {} }
				anchored={ {
					type: 'element',
					at: sortLayoutsButtonRef,
				} }
				refToContentWrapperElement={ sortLayoutsMenuRef }
				closeOnTab={ false }
				focusFirstItemOnOpen={ false }
				{ ...getBlocksHotkeysDataAttributes() }
			>
				{ menuItems.map((item, index) => <PopoverItem { ...item } key={ index } />) }
			</PopoverKeyboardNavigator>
		</>
	);
};
