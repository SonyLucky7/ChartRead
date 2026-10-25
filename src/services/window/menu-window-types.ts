import { Position } from '../../utils';
import { UserPlanBadgeName } from '../user/user';
import { RendererServiceData } from './window-api';
import { TabLinkingState } from './window-features/with-menu';

export interface UserData {
	name: string;
	avatar: string;
	isPro: boolean;
	isAnonymous: boolean;
	userPlanBadgeName: UserPlanBadgeName;
}

export enum MenuType {
	Main = 'main-menu',
	Tab = 'tab-menu',
	TabGroup = 'tab-group-menu',
}

// Values double as the CSS class on the tab menu container.
export enum TabMenuSubmenuSide {
	Left = 'submenu-left',
	Right = 'submenu-right',
}

interface CommonMenuData {
	locale: string;
	isInFullscreenOnWin: boolean;
}

export interface MainMenuOptions {
	user: UserData;
	isDebugMode: boolean;
	undoLabel: string;
	zoom: number | undefined;
	isValidClipboard: boolean;
	isUpdateAvailable: boolean;
	systemRequirementsUnmet: boolean;
}

export interface TabMenuOptions {
	tabId: string;
	submenuSide: TabMenuSubmenuSide;
	menuOffsetY: number;
	copyLink: string | undefined;
	pinned: boolean;
	isDetachTabVisible: boolean;
	isTabTitleCustomizable: boolean;
	canGoBack: boolean;
	canGoForward: boolean;
	isCloseOtherTabsVisible: boolean;
	isCloseTabsToTheRightVisible: boolean;
	isDebugMode: boolean;
	hasShiftKey: boolean;
	isLinkable: boolean;
	tabLinkingState: TabLinkingState | null;
	isChart: boolean;
	// TODO: remove in TVD-2985
	isTabGroupsEnabled: boolean;
	// TODO: remove in TVD-2871
	isTimeAndDateRangeSyncEnabled: boolean;
}

export interface MainMenuData extends RendererServiceData, MainMenuOptions, CommonMenuData {
	type: MenuType.Main;
}

export interface TabMenuData extends Omit<RendererServiceData, 'tabId'>, TabMenuOptions, CommonMenuData {
	type: MenuType.Tab;
	position: Position;
}

export interface TabGroupMenuData extends RendererServiceData, CommonMenuData {
	type: MenuType.TabGroup;
	position: Position;
}

export type MenuData = MainMenuData | TabMenuData | TabGroupMenuData
