import { TFunction } from 'i18next';
import React from 'react';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import {
	svgIconchangeScreenSize28pxStroke1pxTypeMaximize4Corners as fullscreenMaximizeSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/change-screen/size_28px__stroke_1px__type_maximize-4-corners';
import { svgIconcheckSize28pxFilledOnTypeCircle as checkSvgIcon } from '@tradingview/ui-lib/icons/monochrome/check/size_28px__filled_on__type_circle';
import { svgIconcopySize28pxStroke1px as copySvgIcon } from '@tradingview/ui-lib/icons/monochrome/copy/size_28px__stroke_1px';
import {
	svgIcondesktopTwoChartsSize28pxStroke1pxTypeNewWindowDesktop as doubleMonitorSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/desktop-two-charts/size_28px__stroke_1px__type_new-window-desktop';
import { svgIconexclamationSize28pxFilledOn as exclamationSvgIcon } from '@tradingview/ui-lib/icons/monochrome/exclamation/size_28px__filled_on';
import { svgIcongearSize28pxStroke1pxTypeSimple as gearSvgIcon } from '@tradingview/ui-lib/icons/monochrome/gear/size_28px__stroke_1px__type_simple';
import { svgIconlinkSize28pxStroke1pxTypeSync as syncSvgIcon } from '@tradingview/ui-lib/icons/monochrome/link/size_28px__stroke_1px__type_sync';
import { svgIconnewTabSize28pxStroke1px as newTabSvgIcon } from '@tradingview/ui-lib/icons/monochrome/new-tab/size_28px__stroke_1px';
import { svgIconplusSize28pxStroke1pxTypePlus as plusSvgIcon } from '@tradingview/ui-lib/icons/monochrome/plus/size_28px__stroke_1px__type_plus';
import { svgIconresetSize28pxStroke1px as resetSvgIcon } from '@tradingview/ui-lib/icons/monochrome/reset/size_28px__stroke_1px';
import { svgIconsignOutSize28pxStroke1pxTypeOut as signOutSvgIcon } from '@tradingview/ui-lib/icons/monochrome/sign-out/size_28px__stroke_1px__type_out';
import { svgIconupdateSize28pxStroke1px as updateSvgIcon } from '@tradingview/ui-lib/icons/monochrome/update/size_28px__stroke_1px';

import { LinkChannelsConfig } from '../../linking/linkable';
import { loggerServiceProxy } from '../../logger';
import { mainMenuServiceProxy } from '../../services/main-menu-service';
import { MainMenuOptions, TabMenuOptions } from '../../services/window/menu-window-types';
import { TabLinkingState } from '../../services/window/window-features/with-menu';
import { UNABLE_UPDATE_APP } from '../../tv-api';
import { isDarwin, isWin32 } from '../../utils';
import { getWindowControl } from '../common/app-common';
import { HotkeyModifiers } from '../common/hotkey-hash';
import { LinkColor } from '../common/linking-colors';
import { ThemePicker } from '../components-ui/theme-picker';
import { ThemeOptionSize } from '../components-ui/theme-picker/theme-option';
import { MenuItem } from './menu-item/menu-item';
import { MenuItemInfo, MenuItemType } from './menu-item/menu-item-types';
import { TabLinkingItem } from './menu-item/tab-linking/tab-linking-item';
import { ZoomItem } from './menu-item/zoom-item/zoom-item';
import { UpdateAppMenuItem, UpdateAppMenuItemType } from './update-app-menu-item';
import { UserCard } from './user-card/user-card';

import PinTab from './assets/tab-menu-pin-tab.svg';
import UnpinTab from './assets/tab-menu-unpin-tab.svg';

const separator: MenuItemInfo = {
	type: MenuItemType.Separator,
};

const emptyItem: MenuItemInfo = {
	type: MenuItemType.Empty,
};

interface TabMenuItemsOptions extends TabMenuOptions {
	t: TFunction;
}

interface MenuItemsOptions extends MainMenuOptions {
	t: TFunction;
}

function getNavigationMenuItems(t: TFunction, tabId: string, canGoBack?: boolean, canGoForward?: boolean): MenuItemInfo[] {
	if (!canGoBack && !canGoForward) {
		return [];
	}

	const goBackMenuItem: MenuItemInfo = canGoBack
		? {
			type: MenuItemType.Common,
			title: t('Go back'),
			onClick: () => {
				getWindowControl().goBackFromMenu(tabId)
					.catch((error) => {
						loggerServiceProxy().error('getGoBackMenuItems(): getWindowControl().goBackFromMenu() error', error);
					});
			},
		}
		: emptyItem;

	const goForwardMenuItem: MenuItemInfo = canGoForward
		? {
			type: MenuItemType.Common,
			title: t('Go forward'),
			onClick: () => {
				getWindowControl().goForwardFromMenu(tabId)
					.catch((error) => {
						loggerServiceProxy().error('getGoBackMenuItems(): getWindowControl().goForwardFromMenu() error', error);
					});
			},
		}
		: emptyItem;

	return [separator, goBackMenuItem, goForwardMenuItem];
}

interface LinkingItemsOptions {
	tabId: string;
	tabLinkingState: TabLinkingState;
	isChart: boolean;
	// TODO: remove in TVD-2871
	isTimeAndDateRangeSyncEnabled: boolean;
}

// TODO: remove isTimeAndDateRangeSyncEnabled in TVD-2871
function getLinkingMenuItems({ tabId, tabLinkingState, isChart, isTimeAndDateRangeSyncEnabled }: LinkingItemsOptions): MenuItemInfo[] {
	const link = (color: LinkColor): Promise<LinkChannelsConfig> => {
		return getWindowControl().linkFromMenu(tabId, color);
	};

	const unlink = (color: LinkColor): void => {
		getWindowControl().unlinkFromMenu(tabId, color)
			.catch((error) => {
				loggerServiceProxy().error(`getLinkingItems(): getWindowControl().unlinkFromMenu(tabId: ${ tabId }, color: ${ color }) error`, error);
			});
	};

	const updateLinkChannelsConfig = (channelsConfig: LinkChannelsConfig): Promise<void> => {
		return getWindowControl().updateLinkChannelsConfigFromMenu(tabId, channelsConfig);
	};

	const tabLinkingItem: MenuItemInfo = {
		type: MenuItemType.Custom,
		children:
			<TabLinkingItem
				initialTabLinkingState={ tabLinkingState }
				link={ link }
				unlink={ unlink }
				updateLinkChannelsConfig={ updateLinkChannelsConfig }
				isChart={ isChart }
				// TODO: remove in TVD-2871
				isTimeAndDateRangeSyncEnabled={ isTimeAndDateRangeSyncEnabled }
			/>,
		focusable: false,
		hasHorizontalNavigation: true,
	};

	return [
		tabLinkingItem,
	];
}

export function getTabMenuItems({
	t,
	tabId,
	copyLink,
	pinned,
	isDetachTabVisible,
	isTabTitleCustomizable,
	canGoBack,
	canGoForward,
	isCloseOtherTabsVisible,
	isCloseTabsToTheRightVisible,
	isDebugMode,
	hasShiftKey,
	isLinkable,
	tabLinkingState,
	isChart,
	// TODO: remove in TVD-2985
	isTabGroupsEnabled,
	// TODO: remove in TVD-2871
	isTimeAndDateRangeSyncEnabled,
}: TabMenuItemsOptions): MenuItemInfo[] {
	const duplicateMenuItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Duplicate tab'),
		leftSlot: <BlockIcon icon={ copySvgIcon } />,
		hotkey: HotkeyModifiers.CtrlOrCmd + 'U'.charCodeAt(0),
		onClick: () => {
			getWindowControl().duplicateTabFromMenu(tabId)
				.catch((error) => {
					loggerServiceProxy().error('getTabMenuItems(): getWindowControl().duplicateTabFromMenu() error', error);
				});
		},
	};

	const reloadMenuItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Reload tab'),
		leftSlot: <BlockIcon icon={ updateSvgIcon } />,
		hotkey: HotkeyModifiers.CtrlOrCmd + 'R'.charCodeAt(0),
		onClick: () => {
			getWindowControl().reloadTabFromMenu(tabId)
				.catch((error) => {
					loggerServiceProxy().error('getTabMenuItems(): getWindowControl().reloadTabFromMenu() error', error);
				});
		},
	};

	const copyLinkMenuItem: MenuItemInfo = copyLink
		? {
			type: MenuItemType.Common,
			title: t('Copy link'),
			leftSlot: <BlockIcon icon={ syncSvgIcon } />,
			onClick: () => {
				getWindowControl().copyLink(copyLink)
					.catch((error) => {
						loggerServiceProxy().error(`getTabMenuItems(): getWindowControl().copyLink(copyLink: ${ copyLink }) error`, error);
					});
			},
		}
		: emptyItem;

	const togglePinnedTabMenuItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: pinned ? t('Unpin tab') : t('Pin tab'),
		leftSlot: pinned ? <UnpinTab /> : <PinTab />,
		onClick: () => {
			getWindowControl().togglePinnedTabFromMenu(tabId, !pinned)
				.catch((error) => {
					loggerServiceProxy().error('getTabMenuItems(): getWindowControl().togglePinnedTabFromMenu() error', error);
				});
		},
	};

	const detachTabMenuItem: MenuItemInfo = isDetachTabVisible
		? {
			type: MenuItemType.Common,
			title: t('Detach tab'),
			leftSlot: <BlockIcon icon={ newTabSvgIcon } />,
			onClick: () => {
				getWindowControl().detachTabAction(tabId)
					.catch((error) => {
						loggerServiceProxy().error('getTabMenuItems(): getWindowControl().detachTabAction() error', error);
					});
			},
		}
		: emptyItem;

	const customizeTabTitle: MenuItemInfo[] = isTabTitleCustomizable
		? [
			separator,
			{
				type: MenuItemType.Common,
				title: t('Customize tab title...'),
				leftSlot: <BlockIcon icon={ gearSvgIcon } />,
				onClick: () => {
					getWindowControl().openTabSettings()
						.catch((error) => {
							loggerServiceProxy().error('getTabMenuItems(): getWindowControl().openTabSettings() error', error);
						});
				},
			},
		]
		: [emptyItem];

	const navigationItems = getNavigationMenuItems(t, tabId, canGoBack, canGoForward);

	const tabGroupMenuItems = getTabGroupMenuItems({
		onGroupClick: () => {
			getWindowControl().hideTabMenu()
				.catch((error) => {
					loggerServiceProxy().error('getTabMenuItems(): getWindowControl().hideTabMenu() error', error);
				});
		},
	});

	// TODO: remove isTabGroupsEnabled in TVD-2985
	const tabGroupsMenuItem: MenuItemInfo = isTabGroupsEnabled
		? {
			type: MenuItemType.Nested,
			title: t('Move tab'),
			children:
				<>
					{ tabGroupMenuItems.map((item, index) =>
						<MenuItem { ...item } key={ index } />
					) }
				</>,
		}
		: emptyItem;

	const closeMenuItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Close'),
		hotkey: HotkeyModifiers.CtrlOrCmd + 'W'.charCodeAt(0),
		onClick: () => {
			getWindowControl().closeTabFromMenu(tabId)
				.catch((error) => {
					loggerServiceProxy().error('getTabMenuItems(): getWindowControl().closeTabFromMenu() error', error);
				});
		},
	};

	const closeOtherMenuItem: MenuItemInfo = isCloseOtherTabsVisible
		? {
			type: MenuItemType.Common,
			title: t('Close other tabs'),
			onClick: () => {
				getWindowControl().closeOtherTabsFromMenu(tabId)
					.catch((error) => {
						loggerServiceProxy().error(`getTabMenuItems(): getWindowControl().closeOtherTabsFromMenu(tabId: ${ tabId }) error`, error);
					});
			},
		}
		: emptyItem;

	const closeOtherToTheRightMenuItem: MenuItemInfo = isCloseTabsToTheRightVisible
		? {
			type: MenuItemType.Common,
			title: t('Close tabs to the right'),
			onClick: () => {
				getWindowControl().closeTabsToTheRightFromMenu(tabId)
					.catch((error) => {
						loggerServiceProxy().error(`getTabMenuItems(): getWindowControl().closeTabsToTheRightFromMenu(tabId: ${ tabId }) error`, error);
					});
			},
		}
		: emptyItem;

	const openDevToolsMenuItem: MenuItemInfo = isDebugMode || hasShiftKey
		? {
			type: MenuItemType.Common,
			title: t('Developer tools'),
			onClick: () => {
				getWindowControl().openTabDevTools(tabId)
					.catch((error) => {
						loggerServiceProxy().error('getTabMenuItems(): getWindowControl().openTabDevTools() error', error);
					});
			},
		}
		: emptyItem;

	const debugBackdropMenuItem: MenuItemInfo = isDebugMode
		? {
			type: MenuItemType.Common,
			title: t('Toggle debug backdrop'),
			onClick: () => {
				const backdropId = 'debug-window-backdrop';
				const existing = document.getElementById(backdropId);
				if (existing !== null) {
					existing.remove();
					return;
				}

				const backdrop = document.createElement('div');
				backdrop.id = backdropId;
				backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,0.3);pointer-events:none;z-index:-1;';
				document.body.appendChild(backdrop);
			},
		}
		: emptyItem;

	const linkingSectionItem: MenuItemInfo = isLinkable && tabLinkingState !== null
		? {
			type: MenuItemType.Section,
			title: t('Tab linking'),
			// TODO: remove isTimeAndDateRangeSyncEnabled in TVD-2871
			items: getLinkingMenuItems({ tabId, tabLinkingState, isChart, isTimeAndDateRangeSyncEnabled }),
		}
		: emptyItem;

	return [
		duplicateMenuItem,
		reloadMenuItem,
		copyLinkMenuItem,
		togglePinnedTabMenuItem,
		detachTabMenuItem,
		...customizeTabTitle,
		...navigationItems,
		separator,
		tabGroupsMenuItem,
		closeMenuItem,
		closeOtherMenuItem,
		closeOtherToTheRightMenuItem,
		openDevToolsMenuItem,
		debugBackdropMenuItem,
		linkingSectionItem,
	];
}

// TODO: replace with real data in TVD-2933
let tabGroups: string[] = [
	'Placeholder group 1 loooooooooooooooooooooooooooooooooooongggnngngngngn',
	'Placeholder group 2',
	'Placeholder group 3',
];

interface TabGroupMenuItemsOptions {
	onGroupClick(): void;
}

export function getTabGroupMenuItems({ onGroupClick }: TabGroupMenuItemsOptions): MenuItemInfo[] {
	return [
		...tabGroups.map<MenuItemInfo>((group) => ({
			type: MenuItemType.Common,
			title: group,
			onClick: onGroupClick,
		})),
		separator,
		{
			type: MenuItemType.Common,
			title: 'Add placeholder item',
			leftSlot: <BlockIcon icon={ plusSvgIcon } />,
			onClick: () => {
				tabGroups = [...tabGroups, `Placeholder group ${ tabGroups.length + 1 }`];
			},
		},
	];
}

export function getMenuItems({ isDebugMode, t, undoLabel, zoom, isValidClipboard, isUpdateAvailable, systemRequirementsUnmet, user }: MenuItemsOptions): MenuItemInfo[] {
	const userCard: MenuItemInfo = {
		type: MenuItemType.Custom,
		focusable: false,
		children: <UserCard
			{ ...user }
		/>,
	};

	const updateAppMenuItem: MenuItemInfo = isUpdateAvailable
		? {
			type: MenuItemType.Custom,
			focusable: true,
			children:
				<UpdateAppMenuItem
					onClick={ () => {
						mainMenuServiceProxy().updateAndRelaunch()
							.catch((error) => {
								loggerServiceProxy().error('<Menu>.getMenuItems(): mainMenuServiceProxy().updateAndRelaunch() error', error);
							});
					} }
					icon={ <BlockIcon icon={ checkSvgIcon } /> }
					text={ t('Relaunch to update') }
					type={ UpdateAppMenuItemType.Available }
				/>,
		}
		: emptyItem;

	const cannotUpdateAppMenuItem: MenuItemInfo = systemRequirementsUnmet
		? {
			type: MenuItemType.Custom,
			focusable: true,
			children:
				<UpdateAppMenuItem
					onClick={ () => {
						mainMenuServiceProxy().openLink(UNABLE_UPDATE_APP)
							.catch((error) => {
								loggerServiceProxy().error(`<Menu>.getMenuItems(): mainMenuServiceProxy().openLink(url: ${ UNABLE_UPDATE_APP }) error`, error);
							});
					} }
					icon={ <BlockIcon icon={ exclamationSvgIcon } /> }
					text={ t('Unable to update the app') }
					type={ UpdateAppMenuItemType.Warning }
				/>,
		}
		: emptyItem;

	const settingsMenuItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Settings'),
		leftSlot: <BlockIcon icon={ gearSvgIcon } className='ui-lib-icon' />,
		hotkey: HotkeyModifiers.CtrlOrCmd + ','.charCodeAt(0),
		onClick: mainMenuServiceProxy().showSettings,
	};

	const zoomMenuItem: MenuItemInfo[] = zoom
		? [
			{
				type: MenuItemType.Custom,
				focusable: false,
				children: <ZoomItem title={ t('Zoom') } zoom={ zoom } icon={ <BlockIcon icon={ fullscreenMaximizeSvgIcon } /> }/>,
				hasHorizontalNavigation: true,
			},
			separator,
		]
		: [emptyItem];

	const newTabItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('New tab'),
		leftSlot: <BlockIcon icon={ plusSvgIcon } />,
		hotkey: HotkeyModifiers.CtrlOrCmd + 'T'.charCodeAt(0),
		onClick: mainMenuServiceProxy().createNewTab,
	};

	const newWindowItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('New window'),
		leftSlot: <BlockIcon icon={ doubleMonitorSvgIcon } />,
		hotkey: HotkeyModifiers.CtrlOrCmd + 'N'.charCodeAt(0),
		onClick: mainMenuServiceProxy().createNewWindow,
	};

	const reopenWindowItem: MenuItemInfo = undoLabel
		? {
			type: MenuItemType.Common,
			title: undoLabel,
			leftSlot: <BlockIcon icon={ resetSvgIcon } />,
			hotkey: HotkeyModifiers.CtrlOrCmd + HotkeyModifiers.Shift + 'T'.charCodeAt(0),
			onClick: mainMenuServiceProxy().undo,
		}
		: emptyItem;

	const openLinkItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Open link from clipboard'),
		disabled: !isValidClipboard,
		leftSlot: <BlockIcon icon={ syncSvgIcon } />,
		onClick: () => {
			if (isValidClipboard) {
				mainMenuServiceProxy().openLinkFromClipboard()
					.catch((error) => {
						loggerServiceProxy().error('<Menu>.getMenuItems(): mainMenuServiceProxy().openLinkFromClipboard() error', error);
					});
			}
			else {
				loggerServiceProxy().debug('<MenuItem>.onClick: Invalid url in clipboard');
			}
		},
	};

	const themeItem: MenuItemInfo = {
		type: MenuItemType.Custom,
		focusable: false,
		hasHorizontalNavigation: true,
		children:
			<div className='menu-item'>
				<ThemePicker size={ ThemeOptionSize.Relative } />
			</div>,
	};

	const quitItem: MenuItemInfo = {
		type: MenuItemType.Common,
		title: isWin32() ? t('Exit TradingView') : t('Quit TradingView'),
		leftSlot: <BlockIcon icon={ signOutSvgIcon } />,
		hotkey: HotkeyModifiers.CtrlOrCmd + (isDarwin() ? 'Q'.charCodeAt(0) : HotkeyModifiers.Shift + 'Q'.charCodeAt(0)),
		onClick: mainMenuServiceProxy().exit,
	};

	const debugItems: MenuItemInfo[] = isDebugMode
		? [
			separator,
			{
				type: MenuItemType.Common,
				title: t('Open Crash View'),
				onClick: mainMenuServiceProxy().openCrashView,
			},
			{
				type: MenuItemType.Common,
				title: t('Open Tab Monitor'),
				onClick: mainMenuServiceProxy().openTabMonitorView,
			},
		]
		: [emptyItem];

	return [
		userCard,
		separator,
		updateAppMenuItem,
		cannotUpdateAppMenuItem,
		settingsMenuItem,
		newTabItem,
		newWindowItem,
		reopenWindowItem,
		openLinkItem,
		separator,
		...zoomMenuItem,
		themeItem,
		separator,
		quitItem,
		...debugItems,
	];
}
