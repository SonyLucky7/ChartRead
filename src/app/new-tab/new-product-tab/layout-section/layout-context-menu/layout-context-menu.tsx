import { TFunction } from 'i18next';
import React, { ComponentProps, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { svgIconcopySize28pxStroke1px as copySvgIcon } from '@tradingview/ui-lib/icons/monochrome/copy/size_28px__stroke_1px';
import {
	svgIcondesktopTwoChartsSize28pxStroke1pxTypeNewWindowDesktop as doubleMonitorSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/desktop-two-charts/size_28px__stroke_1px__type_new-window-desktop';
import { svgIconlinkSize28pxStroke1pxTypeSync as syncSvgIcon } from '@tradingview/ui-lib/icons/monochrome/link/size_28px__stroke_1px__type_sync';
import { svgIconnewWindowSize28pxStroke1px as browserSvgIcon } from '@tradingview/ui-lib/icons/monochrome/new-window/size_28px__stroke_1px';
import { svgIconplusSize28pxStroke1pxTypePlus as plusSvgIcon } from '@tradingview/ui-lib/icons/monochrome/plus/size_28px__stroke_1px__type_plus';
import { svgIcontrashSize28pxStroke1px as trashSvgIcon } from '@tradingview/ui-lib/icons/monochrome/trash/size_28px__stroke_1px';

import { contextMenuServiceProxy, OpenInAction } from '../../../../../services/context-menu';
import { RendererServiceData } from '../../../../../services/window/window-api';
import { getRendererInitialData } from '../../../../common/app-common';
import { ContextMenu } from '../../context-menu';
import { ContextMenuItemInfo, ContextMenuItemType } from '../../context-menu/context-menu-item';

interface GetMenuItemsOptions {
	t: TFunction;
	title: string;
	url: string;
	onCopyLayout(): void;
	onDeleteLayout(): void;
	onSignUpModalOpen(): void;
	onClose(): void;
}

interface LayoutContextMenuProps extends Omit<ComponentProps<typeof ContextMenu>, 'className' | 'menuItems'> {
	title: string;
	url: string;
	onCopyLayout(): void;
	onDeleteLayout(): void;
	onSignUpModalOpen(): void;
	onClose(): void;
}

function getMenuItems({
	t,
	title,
	url,
	onCopyLayout,
	onDeleteLayout,
	onSignUpModalOpen,
	onClose,
}: GetMenuItemsOptions): ContextMenuItemInfo[] {
	const { tabId } = getRendererInitialData<RendererServiceData>();

	const separator: ContextMenuItemInfo = {
		type: ContextMenuItemType.Separator,
	};

	const openInNewTab: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: plusSvgIcon,
		onClick: () => {
			contextMenuServiceProxy().handleOpen(OpenInAction.NewTab, url, tabId, title);
			onClose();
		},
		title: t('Open in new tab'),
	};

	const openInNewWindow: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: doubleMonitorSvgIcon,
		onClick: () => {
			contextMenuServiceProxy().handleOpen(OpenInAction.NewWindow, url, tabId, title);
			onClose();
		},
		title: t('Open in new window'),
	};

	const openSignUpModal: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: doubleMonitorSvgIcon,
		onClick: () => {
			onSignUpModalOpen();
			onClose();
		},
		title: t('Open in new window'),
	};

	const copyLayout: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: copySvgIcon,
		onClick: onCopyLayout,
		title: t('Make a copy...'),
	};

	const openInBrowser: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: browserSvgIcon,
		onClick: () => {
			contextMenuServiceProxy().handleOpen(OpenInAction.Browser, url);
			onClose();
		},
		title: t('Open link in browser'),
	};

	const copyLink: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: syncSvgIcon,
		onClick: () => {
			contextMenuServiceProxy().copyLink(url);
			onClose();
		},
		title: t('Copy link'),
	};

	const deleteLayout: ContextMenuItemInfo = {
		type: ContextMenuItemType.Common,
		icon: trashSvgIcon,
		onClick: onDeleteLayout,
		title: t('Remove layout'),
	};

	// if url ends with '/chart' the context menu is being opened for open default chart button
	if (url.endsWith('/chart')) {
		return [
			openInNewTab,
			openSignUpModal,
			separator,
			openInBrowser,
			copyLink,
		];
	}

	const items = [
		openInNewTab,
		openInNewWindow,
		copyLayout,
		separator,
		openInBrowser,
		copyLink,
		separator,
		deleteLayout,
	];

	return items;
}

export const LayoutContextMenu = ({
	title,
	url,
	onCopyLayout,
	onDeleteLayout,
	onSignUpModalOpen,
	onClose,
	...props
}: LayoutContextMenuProps): JSX.Element => {
	const { t } = useTranslation();

	const [menuItems, setMenuItems] = useState<ContextMenuItemInfo[]>([]);

	useLayoutEffect(() => {
		if (!url) {
			return;
		}

		setMenuItems(
			getMenuItems({
				t,
				title,
				url,
				onCopyLayout,
				onDeleteLayout,
				onSignUpModalOpen,
				onClose,
			})
		);
	}, [onClose, onCopyLayout, onDeleteLayout, onSignUpModalOpen, t, title, url]);

	if (!menuItems.length) {
		return <></>;
	}

	return (
		<ContextMenu
			menuItems={ menuItems }
			{ ...props }
		/>
	);
};
