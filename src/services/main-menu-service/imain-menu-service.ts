import { BrowserWindow } from 'electron';
import { Observable } from 'rxjs';

import { SettingsWindowOptions } from '../settings';

export interface IMainMenuService {
	menuOpenedChange: Observable<boolean>;
	recreateMenuWindow(): void;
	getMenuOpened(): boolean;
	setMenuOpened(isOpened: boolean): void;
	showMenu(wndId: string): Promise<void>;
	hideMenu(isNoFocusParent?: boolean): void;
	signIn(): void;
	openUserPage(user: string): void;
	openLink(url: string): void;
	updateAndRelaunch(): void;
	showSettings(wnd?: BrowserWindow, options?: SettingsWindowOptions): void;
	createNewTab(wnd?: BrowserWindow): void;
	createNewWindow(): void;
	undo(): void;
	increaseZoom(wnd?: BrowserWindow): Promise<number | undefined>;
	decreaseZoom(wnd?: BrowserWindow): Promise<number | undefined>;
	openLinkFromClipboard(wnd?: BrowserWindow): void;
	exit(): void;
	openCrashView(): void;
	openTabMonitorView(): void;
}

export const MAIN_MENU_SERVICE_CONTRACT = 'tvd:main-menu-service';
