import { clipboard, screen } from 'electron';

import { LINK_CHANNELS_CONFIG_LINKING_OFF, LinkChannelsConfig, LinkGroupName, linkingService } from '../../../linking';
import { loggerService } from '../../../logger';
import { logCall, logCallName } from '../../../logger/log-decorator';
import { featureService } from '../../../tv-services/feature';
import { TIME_AND_DATE_RANGE_LINKING_FEATURE, TVD_TAB_GROUPS } from '../../../tv-services/feature/ifeature-service';
import { getPersistentChartUrl, ignorePromise, isChartUrl, isChartUrlWithParams, isDarwin, isLinkableUrl, isTVHostedUrl, isWin32, Position, sleep } from '../../../utils';
import { fitInRange } from '../../../utils/math';
import { localeService } from '../../locale';
import { mainMenuService } from '../../main-menu-service';
import { mainService } from '../../main-service';
import { DefaultSystemNameTab } from '../../settings/settings-tabs';
import { showSettingsWindow } from '../../settings/settings-window';
import { trackEventService } from '../../track-event-service';
import { authenticatedFeature } from '../../user/profeature';
import { MenuWindow, MenuWindowType } from '../menu-window';
import { MenuData, MenuType, TabMenuSubmenuSide } from '../menu-window-types';
import { TabbedWindowBase } from '../tabbed-window';
import { IWindowMenuControl, WindowState } from '../window-api';
import { windowService } from '..';
import { WindowMixin } from './window-mixin';

// Transparent gutter around the menu content: the window position is inset by
// this (see calculateTabMenuLayout) and the CSS offsets the content back by the
// same amount, so the content corner lands on the click and the gutter leaves
// room for the shadow. Each window column is the visible (bare) menu width plus
// this gutter on both sides. MAX_BARE_* must match --ui-lib-positioner-max-width
// in menu-window.css, which caps the popover content.
const TAB_MENU_MARGIN = 4;

// Default of the ui-lib popover's inner content padding
// (--ui-lib-popover-content-vertical-padding). Keep in sync with ui-lib.
const POPOVER_CONTENT_PADDING = 6;

const MAX_BARE_TAB_MENU_WIDTH = 282;
const TAB_MENU_WIDTH = MAX_BARE_TAB_MENU_WIDTH + TAB_MENU_MARGIN * 2;
// The submenu opens flush against the base menu, so its own content padding eats
// into the shared space - reserve that much less for it.
const TAB_MENU_SUBMENU_WIDTH = MAX_BARE_TAB_MENU_WIDTH - POPOVER_CONTENT_PADDING;
const TAB_MENU_WINDOW_WIDTH = TAB_MENU_WIDTH + TAB_MENU_SUBMENU_WIDTH;
const TAB_MENU_HEIGHT = 900;

const MAX_BARE_TAB_GROUP_MENU_WIDTH = 282;
const TAB_GROUP_MENU_WIDTH = MAX_BARE_TAB_GROUP_MENU_WIDTH + TAB_MENU_MARGIN * 2;
// TODO: adjust height in TVD-2933
const TAB_GROUP_MENU_HEIGHT = 900;

export type TabLinkingState = {
	color: LinkGroupName | null;
	channelsConfig: LinkChannelsConfig;
}

interface TabLinkingAvailability {
	isLinkable: boolean;
	tabLinkingState: TabLinkingState | null;
}

interface TabMenuLayout {
	menuPosition: Position;
	submenuSide: TabMenuSubmenuSide;
	menuOffsetY: number;
}

function isFullscreenOnWin(window: TabbedWindowBase): boolean {
	const windowState = window.getWindowState();
	return (windowState === WindowState.FullscreenWithPanel || windowState === WindowState.Fullscreen) && isWin32();
}

// TODO: improve the tab group menu position calculation in TVD-2993
function calculateTabMenuLayout(tabMenuWindow: MenuWindow, window: TabbedWindowBase, clickPosition: Position, isInFullscreenOnWin: boolean): TabMenuLayout {
	const tabbedWindowBounds = window.windowRef.getBounds();
	const correction = tabMenuWindow.getWin32PositionCorrection(tabbedWindowBounds, window);

	const menuPosition = {
		x: tabbedWindowBounds.x + clickPosition.x - TAB_MENU_MARGIN + correction.x,
		y: tabbedWindowBounds.y + clickPosition.y - TAB_MENU_MARGIN + correction.y,
	};

	// Pick the display by the actual menu point, not the window bounds: when the window
	// straddles two monitors the menu can open on the one that holds less of the window,
	// and all overflow math below must clamp to the display the menu really appears on.
	const workArea = screen.getDisplayNearestPoint(menuPosition).workArea;

	// In LTR the submenu prefers to open to the right of the base menu; in RTL it mirrors
	// and prefers the left. Each direction falls back to the opposite side only when the
	// preferred side would overflow the matching work-area edge. Fullscreen on Windows keeps
	// it on the right (the submenu space is reserved inside the window in that mode).
	const isRtl = localeService().isRtl();
	// The menu window is TAB_MENU_WINDOW_WIDTH wide. On the right side its left edge sits at
	// the click; on the left side it is mirrored so its right edge sits at the click (see the
	// shift below). A side "fits" when the whole window stays within the work area there.
	// `2 * TAB_MENU_MARGIN` accounts for the small inset that keeps the cursor inside the menu.
	const leftSideShift = TAB_MENU_WINDOW_WIDTH - 2 * TAB_MENU_MARGIN;
	const fitsRight = menuPosition.x + TAB_MENU_WINDOW_WIDTH <= workArea.x + workArea.width;
	const fitsLeft = menuPosition.x - leftSideShift >= workArea.x;

	let submenuSide: TabMenuSubmenuSide;
	if (isInFullscreenOnWin) {
		submenuSide = TabMenuSubmenuSide.Right;
	}
	else if (isRtl) {
		submenuSide = fitsLeft ? TabMenuSubmenuSide.Left : TabMenuSubmenuSide.Right;
	}
	else {
		submenuSide = fitsRight ? TabMenuSubmenuSide.Right : TabMenuSubmenuSide.Left;
	}

	// `submenuSide` doubles as the container CSS class and tells the renderer which edge to
	// anchor the base menu to. `menuPosition` is computed for the right side (base menu's left
	// edge at the click). For the left side we mirror that layout: shift the window so its
	// right edge sits at the click, so the base menu opens to the LEFT of the cursor
	// (right-anchored) and the submenu extends further left.
	if (submenuSide === TabMenuSubmenuSide.Left) {
		menuPosition.x -= leftSideShift;
	}

	const overflowY = isInFullscreenOnWin
		? 0
		: menuPosition.y + TAB_MENU_HEIGHT - (workArea.y + workArea.height);
	const menuOffsetY = fitInRange(overflowY, menuPosition.y - workArea.y, 0);
	menuPosition.y -= menuOffsetY;

	return { menuPosition, submenuSide, menuOffsetY };
}

function resolveTabLinkingState(tabId: string, tabUrl: string): TabLinkingAvailability {
	try {
		if (!isLinkableUrl(getPersistentChartUrl(tabUrl))) {
			return { isLinkable: false, tabLinkingState: null };
		}
	}
	catch (error) {
		loggerService().error('resolveTabLinkingState(): getPersistentChartUrl() error', error);
		return { isLinkable: false, tabLinkingState: null };
	}

	const color = linkingService().getGroupName(tabId);
	const tabLinkingState: TabLinkingState = color !== null
		? { color, channelsConfig: linkingService().getGroupChannelsConfig(color) }
		: { color: null, channelsConfig: LINK_CHANNELS_CONFIG_LINKING_OFF };

	return { isLinkable: true, tabLinkingState };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/naming-convention
export function WithMenu<T extends WindowMixin<TabbedWindowBase>>(Base: T) {
	@logCallName('WithMenu')
	class TrackableMenuWnd extends Base implements IWindowMenuControl {
		private tabMenuWindow: MenuWindow | null = null;
		private tabGroupMenuWindow: MenuWindow | null = null;

		constructor(...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);

			this.getMenuWindow();
		}

		private getMenuWindow(): MenuWindow {
			if (this.tabMenuWindow === null || this.tabMenuWindow.isDestroyed()) {
				this.tabMenuWindow = new MenuWindow(
					MenuWindowType.WithMenu,
					TAB_MENU_WINDOW_WIDTH,
					TAB_MENU_HEIGHT,
					true
				);
			}
			return this.tabMenuWindow;
		}

		private getTabGroupMenuWindow(): MenuWindow {
			if (this.tabGroupMenuWindow === null || this.tabGroupMenuWindow.isDestroyed()) {
				this.tabGroupMenuWindow = new MenuWindow(
					MenuWindowType.TabGroup,
					TAB_GROUP_MENU_WIDTH,
					TAB_GROUP_MENU_HEIGHT,
					true
				);
			}
			return this.tabGroupMenuWindow;
		}

		override topAreaHover(isHovered: boolean): void {
			if (this.tabsPanelShow && this.tabMenuWindow?.isMenuOpened) {
				return;
			}

			super.topAreaHover(isHovered);
		}

		hideTabMenu(isNoFocusParent?: boolean): void {
			if (this.tabMenuWindow === null) {
				return;
			}
			this.tabMenuWindow.hide(isNoFocusParent);
		}

		private isDetachTabVisible(): boolean {
			return this.tabs.length > 1;
		}

		private isCloseOtherTabsVisible(tabId: string): boolean {
			return (
				this.tabs.length > 1 &&
				this.tabs.some((t) => t.id !== tabId && !t.pinned)
			);
		}

		private isCloseTabsToTheRightVisible(tabId: string): boolean {
			return (
				this.tabs.length > 1 &&
				this.tabs.findIndex((t) => t.id === tabId) + 1 < this.tabs.length &&
				this.tabs.some((t) => !t.pinned)
			);
		}

		async showTabMenu(tabId: string, hasShiftKey: boolean, position: Position): Promise<void> {
			const tab = this.tabs.find(t => t.id === tabId);
			if (!tab?.isBrowserViewValid()) {
				return;
			}

			const tabMenuWindow = this.getMenuWindow();

			// right click on macOs does not blur window, it causes blinking when you call the menu sequentially
			if (isDarwin()) {
				tabMenuWindow.hide();
				mainMenuService().hideMenu();
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				await sleep(40);
			}

			if (!tabMenuWindow.isInputEvents()) {
				tabMenuWindow.setInputEvents(this.windowRef);
			}
			tabMenuWindow.attachToWindow(this.windowRef);
			const isInFullscreenOnWin = isFullscreenOnWin(this);

			const { menuPosition, submenuSide, menuOffsetY } = calculateTabMenuLayout(tabMenuWindow, this, position, isInFullscreenOnWin);

			const tabUrl = tab.getURL();

			const { isLinkable, tabLinkingState } = resolveTabLinkingState(tabId, tabUrl);

			const menuData: MenuData = {
				remoteServiceInstanceId: this.remoteServiceInstanceId,
				type: MenuType.Tab,
				locale: localeService().currentLocale(),
				isInFullscreenOnWin,
				submenuSide,
				menuOffsetY,
				position,
				tabId,
				copyLink: isTVHostedUrl(tabUrl) ? tabUrl : undefined,
				pinned: tab.pinned,
				isDetachTabVisible: this.isDetachTabVisible(),
				isTabTitleCustomizable: isChartUrl(tabUrl) || isChartUrlWithParams(tabUrl),
				canGoBack: tab.canGoBack,
				canGoForward: tab.canGoForward,
				isCloseOtherTabsVisible: this.isCloseOtherTabsVisible(tabId),
				isCloseTabsToTheRightVisible: this.isCloseTabsToTheRightVisible(tabId),
				isDebugMode: mainService().isDebugMode(),
				hasShiftKey,
				isLinkable,
				tabLinkingState,
				isChart: isChartUrl(tabUrl),
				// TODO: remove in TVD-2985
				isTabGroupsEnabled: featureService().isFeatureEnabled(TVD_TAB_GROUPS, false),
				// TODO: remove in TVD-2871
				isTimeAndDateRangeSyncEnabled: featureService().isFeatureEnabled(TIME_AND_DATE_RANGE_LINKING_FEATURE, false),
			};

			await tabMenuWindow.loadMenu(menuData);

			tabMenuWindow.show(this, menuPosition);
		}

		public async showTabGroupMenu(position: Position): Promise<void> {
			const menu = this.getTabGroupMenuWindow();

			// right click on macOs does not blur window, it causes blinking when you call the menu sequentially
			if (isDarwin()) {
				menu.hide();
				mainMenuService().hideMenu();
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				await sleep(40);
			}

			if (!menu.isInputEvents()) {
				menu.setInputEvents(this.windowRef);
			}
			menu.attachToWindow(this.windowRef);

			const wndBounds = this.windowRef.getBounds();
			const correction = menu.getWin32PositionCorrection(wndBounds, this);
			// TODO: improve the tab group menu position calculation in TVD-2993 (clamp to the
			// screen edges and handle overflow, similar to calculateTabMenuLayout()).
			const menuPosition = {
				x: wndBounds.x + position.x + correction.x,
				y: wndBounds.y + position.y + correction.y,
			};

			const isInFullscreenOnWin = isFullscreenOnWin(this);

			await menu.loadMenu({
				remoteServiceInstanceId: this.remoteServiceInstanceId,
				type: MenuType.TabGroup,
				locale: localeService().currentLocale(),
				isInFullscreenOnWin,
				position,
			});

			menu.show(this, menuPosition);
		}

		hideTabGroupMenu(): void {
			if (this.tabGroupMenuWindow === null) {
				return;
			}
			this.tabGroupMenuWindow.hide();
		}

		duplicateTabFromMenu(tabId: string): void {
			ignorePromise(this.duplicateTab(tabId));
			this.hideTabMenu();
		}

		reloadTabFromMenu(tabId: string): void {
			loggerService().info('Tab context menu: Reload');
			this.reloadTab(tabId);
			this.hideTabMenu();
		}

		copyLink(link: string): void {
			loggerService().debug('Tab context menu: Copy link');
			const [linkWithoutRendererData] = link.split('?rendererInitialData');
			clipboard.writeText(linkWithoutRendererData, 'clipboard');
			this.hideTabMenu();
		}

		togglePinnedTabFromMenu(tabId: string, pinned: boolean): void {
			loggerService().debug('Tab context menu: Toggle pinned');
			ignorePromise(this.togglePinnedTab(tabId, pinned));
			this.hideTabMenu();
		}

		@authenticatedFeature
		detachTabAction(tabId: string): void {
			loggerService().info('Tab context menu: Detach tab');

			try {
				const detachedTabId = this.detachTab(tabId);

				if (detachedTabId !== null) {
					windowService().newWindow({ tabId: detachedTabId, sourceWindow: this.windowRef });
				}
				this.hideTabMenu();
			}
			catch (err) {
				loggerService().error(`[Tab context menu: Detach tab] Failed to detach tab ${ tabId }`, err);
				this.acceptExistingTab(tabId);
			}
		}

		closeTabFromMenu(tabId: string): void {
			loggerService().info('Tab context menu: Close');
			this.closeTab(tabId)
				.catch((error) => {
					loggerService().error('WithMenu.closeTabFromMenu(): this.closeTab() error', error);
				});
			this.hideTabMenu();
		}

		closeOtherTabsFromMenu(tabId: string): void {
			loggerService().info('Tab context menu: Close other tabs');
			this.closeOtherTabs(tabId)
				.catch(error => {
					loggerService().error('Close other tabs failed', error);
				});
			this.hideTabMenu();
		}

		@logCall
		openTabSettings(): void {
			this.hideTabMenu();
			showSettingsWindow(this.windowRef, { currentActiveTab: DefaultSystemNameTab.Tab })
				.then(() => {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					trackEventService().trackEvent({ eventName: 'tabMenu_customizeTabTitle_clicked', parameters: { engagement_time_msec: 1 } });
				})
				.catch(error => {
					loggerService().error('WithMenu.openTabSettings(): showSettingsWindow() error', error);
				});
		}

		closeTabsToTheRightFromMenu(tabId: string): void {
			loggerService().info('Tab context menu: Close tabs to the right');
			this
				.closeTabsToTheRight(tabId)
				.catch(error => {
					loggerService().error('[Tab context menu: Close tabs to the right] Failed to close tabs to the right', error);
				});
			this.hideTabMenu();
		}

		goBackFromMenu(tabId: string): void {
			const tab = this.tabs.find(t => t.id === tabId);
			if (!tab) {
				return;
			}
			loggerService().info('Tab context menu: Go Back');
			ignorePromise(tab.goBack());
			this.hideTabMenu();
		}

		goForwardFromMenu(tabId: string): void {
			const tab = this.tabs.find(t => t.id === tabId);
			if (!tab) {
				return;
			}
			loggerService().info('Tab context menu: Go Forward');
			ignorePromise(tab.goForward());
			this.hideTabMenu();
		}

		linkFromMenu(tabId: string, groupName: LinkGroupName): LinkChannelsConfig {
			loggerService().info(`WithMenu.linkFromMenu(groupName: ${ groupName })`);

			linkingService().assignGroup(tabId, groupName);

			return linkingService().getGroupChannelsConfig(groupName);
		}

		unlinkFromMenu(tabId: string, groupName: LinkGroupName): void {
			loggerService().info(`WithMenu.unlinkFromMenu(groupName: ${ groupName })`);

			linkingService().unassignGroup(tabId);
		}

		updateLinkChannelsConfigFromMenu(tabId: string, partialConfig: Partial<LinkChannelsConfig>): void {
			linkingService().applyGroupChannelsConfig(tabId, partialConfig);
		}

		openTabDevTools(tabId: string): void {
			const tab = this.tabs.find(t => t.id === tabId);
			if (!tab) {
				return;
			}
			loggerService().info('Tab context menu: Developer tools');
			this.hideTabMenu(true);
			tab.openDevTools({ mode: 'detach' });
		}
	}

	return TrackableMenuWnd;
}
