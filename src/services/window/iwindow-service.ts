import { BrowserWindow } from 'electron';
import { Observable, Subject } from 'rxjs';

import { LinkGroupName } from '../../linking';
import { TabId } from '../../main/tab-manager';
import { WindowPreferences } from '../../navigation/window-navigation-preferences';
import { SaveChangesDecision, SaveChangesErrorState } from './tab/save-changes-types';
import { Tab } from './tab/tab';
import { TvTab } from './tab/tv-tab';
import { TabbedWindow } from './tabbed-window-imports';
import { WindowBounds, ZoomDirection } from './window-api';
import { TabbedWindowOptions } from './window-options';
import { IWithListener } from './with-listener';

export const WINDOW_SERVICE_CONTRACT = 'tvd:window-service';

export enum CheckUnsavedChangesMode {
	Ask = 'ask',
	CheckOnly = 'check-only',
}

export interface WindowLinkedTabState {
	id: string;
	linkGroupName?: LinkGroupName;
}

export interface WindowUndoState {
	options: TabbedWindowOptions;
	linkedTabs: WindowLinkedTabState[];
	[key: string]: unknown;
}

export interface WindowCloseStatus {
	mayClose: boolean;
	closeToAll: boolean;
	closeForbiddenTabId?: TabId;
}

export interface NewWindowInfo {
	windowPreferences?: WindowPreferences;
	tabId?: TabId;
	sourceWindow?: BrowserWindow;
	sourceTab?: Tab;
	linkNewTab?: boolean;
	url?: string;
}

export interface FindWindowCriteria {
	refWindow: BrowserWindow;
	windowId: string;
	tabWebContents: Electron.WebContents;
	tabId: TabId;
	windowPersistentId: string;
}

export interface IWindowService extends IWithListener {
	readonly chartWindowSubject: Subject<number>;
	/**
	 * renderer -> main: the user's decision in the dialog error state. The scope tag lets concurrent
	 * flows (e.g. two windows closing at once) ignore decisions that aren't theirs.
	 */
	readonly saveChangesDecisionSubject: Subject<SaveChangesDecision>;
	/**
	 * main -> renderer: toggles a SaveChangesDialog's error state, scoped so one window's failure
	 * does not flip the dialogs of other windows running their own teardown flow concurrently
	 */
	readonly saveChangesErrorSubject: Subject<SaveChangesErrorState>;

	readonly zoomChange: Observable<number>;
	/**
	 *
	 * @param to : percentage value from 0.2 to 5.0
	 * @default 1
	 */

	removeRecordFlagForAllCharts(): void;
	getRecordFlag(): boolean;
	anyChartTabHasIdeaRecording(chartTabs: TvTab[], chartMessages: (string | undefined)[]): boolean;

	newWindow(params?: NewWindowInfo, options?: TabbedWindowOptions): TabbedWindow;
	/**
	 * Renderer-facing wrapper around newWindow(): returns void so the result is serializable over
	 * the IPC proxy. newWindow() returns a TabbedWindow instance, which cannot be structured-cloned and
	 * therefore rejects the remote invocation when called via windowServiceProxy().
	 */
	openNewWindow(params?: NewWindowInfo, options?: TabbedWindowOptions): void;
	changeTabParent(sourceWindow: TabbedWindow, destinationWindow: TabbedWindow, tabId: TabId, position?: number): Promise<void>;

	findWindow(criteria: Partial<FindWindowCriteria>): TabbedWindow | undefined;

	getChartWindows(): Iterable<TabbedWindow>;
	getWindowByViewId(id: number): TabbedWindow | undefined;
	getLastFocusedWindow(): TabbedWindow | undefined;
	getAllChartTabs(addChartsWithParams?: boolean): TvTab[];
	getAllTabs(): Tab[];
	getCountWindows(): number;
	getMaxWindowsInSession(): number;

	checkAutoSave(): Promise<boolean>;
	restoreWindow(state: WindowUndoState): void;
	shouldPreventCloseForUnsavedChanges(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<boolean>;
	saveAllChanges(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<void>;
	closeAllSaveChangesDialog(): void;

	getRendererReports(): Promise<unknown>;

	mayClose(): boolean;

	broadcastChannel(channel: string, ...values: unknown[]): void;

	isShowTabsPanelFullscreen: boolean;
	zoom(to: ZoomDirection | number, hidePopup?: boolean): Promise<number | undefined>;
	getZoomFactor(): number;
	recomputeFullscreenedWindowsBounds(isTabPanelHidden: boolean): void;

	isChartWindow(tabId: number): boolean;

	getActiveWindowsBounds(): WindowBounds[];
	getDragElements(): string[];

	readonly tokyoNightSubject: Subject<boolean>;
	toggleTokyoNight(): void;
	getTokyoNightStatus(): boolean;

	dispose(): Promise<void>;
}
