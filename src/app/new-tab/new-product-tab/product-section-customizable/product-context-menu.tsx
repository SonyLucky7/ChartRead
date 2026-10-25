import { TFunction } from 'i18next';
import React, { ComponentProps, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	svgIcondesktopTwoChartsSize28pxStroke1pxTypeNewWindowDesktop as doubleMonitorSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/desktop-two-charts/size_28px__stroke_1px__type_new-window-desktop';
import { svgIconlinkSize28pxStroke1pxTypeSync as syncSvgIcon } from '@tradingview/ui-lib/icons/monochrome/link/size_28px__stroke_1px__type_sync';
import { svgIconnewWindowSize28pxStroke1px as browserSvgIcon } from '@tradingview/ui-lib/icons/monochrome/new-window/size_28px__stroke_1px';
import { svgIconplusSize28pxStroke1pxTypePlus as plusSvgIcon } from '@tradingview/ui-lib/icons/monochrome/plus/size_28px__stroke_1px__type_plus';

import { contextMenuServiceProxy, OpenInAction } from '../../../../services/context-menu';
import { RendererServiceData } from '../../../../services/window/window-api';
import { getRendererInitialData } from '../../../common/app-common';
import { ContextMenu } from '../context-menu/context-menu';
import { ContextMenuItemInfo, ContextMenuItemType } from '../context-menu/context-menu-item/context-menu-item';

interface GetMenuItemsOptions {
	t: TFunction;
	url: string;
	onClose(): void;
	title: string;
}

interface ProductContextMenuProps extends Omit<ComponentProps<typeof ContextMenu>, 'className' | 'menuItems'> {
	url: string;
	onClose(): void;
	title: string;
}

function getMenuItems({ t, title, url, onClose }: GetMenuItemsOptions): ContextMenuItemInfo[] {
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

	return [
		openInNewTab,
		openInNewWindow,
		separator,
		openInBrowser,
		copyLink,
	];
}

export const ProductContextMenu = ({ title, url, onClose, ...props }: ProductContextMenuProps): JSX.Element => {
	const { t } = useTranslation();

	const [menuItems, setMenuItems] = useState<ContextMenuItemInfo[]>([]);

	useLayoutEffect(() => {
		if (!url) {
			return;
		}

		setMenuItems(
			getMenuItems({ t, title, url, onClose })
		);
	}, [onClose, t, title, url]);

	if (!menuItems.length) {
		return <></>;
	}

	return (
		<ContextMenu
			{ ...props }
			menuItems={ menuItems }
		/>
	);
};
