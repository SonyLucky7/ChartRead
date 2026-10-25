import { BrowserView } from 'electron';

import { Tab } from '../window/tab/tab';

export const CONTEXT_MENU_SERVICE_CONTRACT = 'tvd:context-menu-service';

export enum OpenInAction {
	NewTab,
	NewWindow,
	Browser,
}

export interface IContextMenuService {
	createContextMenu(tab: Tab, view: BrowserView): void;
	handleOpen(action: OpenInAction, url?: string, tabId?: string, title?: string,): void;
	copyLink(link?: string): void;
}
