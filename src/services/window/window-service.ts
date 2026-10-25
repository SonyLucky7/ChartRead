import { app, BrowserWindow, Display, ipcMain, screen } from 'electron';
import { Subject } from 'rxjs';

import { AppOnboardingLaunchSource } from '../../app/dialog-window/welcome-dialog/constants';
import { webcontentTaskService } from '../../app/webcontent-based-tasks';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { linkingService } from '../../linking';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId } from '../../logger/log-formatter';
import { sessionStorageService } from '../../main/session-storage';
import { TabId, tabManager } from '../../main/tab-manager';
import { performanceService } from '../../performance';
import {
	AttachPersistentRoot,
	IPersistentCompoundObject,
	persistenceService,
	PersistentArray,
	PersistentCompoundObject,
	PersistentField,
} from '../../persistence';
import { FOCUS_PINE_EDITOR, GET_TABBED_WINDOW_ID, OPEN_NEW_WINDOW, SCREEN_CAPTURE } from '../../tv-api/tvd-channels';
import { modifyWithoutNotifications } from '../../tvd-runtime/core/persistence/persistence';
import {
	centeredRect,
	ignorePromise,
	isChartUrl,
	isChartUrlWithParams,
	isLocalURI,
	isPineEditorUrl,
	Rectangle,
	UndoStack,
	unorderedPromiseAllSettled,
} from '../../utils';
import { isMSStore } from '../../utils/application-repository-type';
import { getSetOfTabIdsFromUndoEntries, getSetOfTabIdsFromUndoEntry } from '../../utils/undo-entry';
import { appEventService } from '../app-event-service';
import { appSettingsService } from '../app-settings-service';
import { getConfiguration } from '../configuration';
import { CHART_RECORD_IDEA_WARNING_MESSAGE } from '../interfaces';
import { localeService } from '../locale';
import i18n from '../locale/i18n';
import { mainMenuService } from '../main-menu-service';
import { mainService } from '../main-service';
import { closeSettingsWindow, isSettingsWindowShown } from '../settings/settings-window';
import { userService } from '../user';
import { authenticatedFeature } from '../user/profeature';
import {
	CheckUnsavedChangesMode,
	IWindowService,
	windowService,
	WindowUndoState,
} from './index';
import {
	FindWindowCriteria,
	NewWindowInfo,
	WINDOW_SERVICE_CONTRACT,
	WindowCloseStatus,
	WindowLinkedTabState,
} from './iwindow-service';
import { StatefulWindow } from './stateful-window';
import { awaitSaveChangesDecisionOnce, runSaveChangesFlow, SaveChangesFlowResult } from './tab/save-changes-flow';
import { APP_SAVE_SCOPE, SaveChangesDecision, SaveChangesDecisionType, SaveChangesErrorState } from './tab/save-changes-types';
import { collectChartTabsPendingSave } from './tab/shutdown-checks';
import { Tab } from './tab/tab';
import { TvTab } from './tab/tv-tab';
import { createEmptyWindow as createTabbedEmptyWindow, getDefaultTabbedWindowOptions, TabbedWindow } from './tabbed-window-imports';
import { WINDOW_HEADER_HEIGHT, WindowBounds, WindowState, ZoomDirection } from './window-api';
import { TabbedWindowOptions } from './window-options';
import { WindowServiceEvents, WithListener } from './with-listener';
import { ZoomController } from './zoom-controller';

export interface AppStateInner {
	focusedWindowId: string;
	shouldCredentialsSave?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WindowService extends IPersistentCompoundObject { }

@ExposeSingletonService(WINDOW_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('WindowService')
@AttachPersistentRoot('app')
@PersistentCompoundObject
export class WindowService extends WithListener implements IWindowService {
	public readonly tokyoNightSubject = new Subject<boolean>();
	/**
	 * the user's decision in the SaveChangesDialog error state, tagged with the originating
	 * teardown flow's scope so concurrent flows in other windows ignore it
	 */
	public readonly saveChangesDecisionSubject = new Subject<SaveChangesDecision>();
	public readonly saveChangesErrorSubject = new Subject<SaveChangesErrorState>();

	private hasTokyoNight = false;

	private defaultWindow: TabbedWindow | undefined;
	@PersistentArray(TabbedWindow)
	readonly chartWindows: TabbedWindow[] = [];

	private preventAppClose = false;
	private lastFocusedChartWindow: TabbedWindow | undefined;
	isShowTabsPanelFullscreen = true;

	private zoomController = new ZoomController();
	zoomChange = this.zoomController.zoomChange;

	private localeReadyPromise: Promise<void>;
	private maxWindowsInSession = 0;

	public chartWindowSubject = new Subject<number>();

	@PersistentField({ name: 'state' })
	readonly state: AppStateInner = {
		focusedWindowId: '',
	};

	constructor() {
		super();
		loggerService().debug('Initializing WindowService');

		this.setSecondInstanceFocusHandler();

		StatefulWindow.windowClosed.subscribe((wnd: StatefulWindow) => {
			this.deleteWindow(wnd);
		});

		app.on('browser-window-focus', (ev, wnd) => {
			this.updateLastFocusedWindow(wnd);
		});

		persistenceService().stateRestored.subscribe(() => {
			// TODO: should be removed after dropping 1.0.2 version support
			if (typeof this.state.shouldCredentialsSave !== 'undefined') {
				appSettingsService().set('saveCredentials', this.state.shouldCredentialsSave);
				this.state.shouldCredentialsSave = undefined;
			}

			this.ensureWindowShow();
			ignorePromise(this.onRestoreSession());
		});

		userService().prepareUserSignIn.subscribe((signInData) => {
			const work = (async(): Promise<void> => {
				await tabManager().resetState();
			})();

			signInData.workAcceptor(work);
		});

		userService().userSignedOut.subscribe(() => {
			ignorePromise(this.startAnonymousSession());
		});

		localeService().localeChange.subscribe(() => {
			ignorePromise(this.applyLocale());
		});

		this.tokyoNightSubject.subscribe((value) => {
			this.hasTokyoNight = value;
		});

		this.localeReadyPromise = new Promise((resolve) => {
			const localeSub = localeService().localeInitialize.subscribe(() => {
				localeSub.unsubscribe();
				resolve();
			});
		});

		ipcMain.on(SCREEN_CAPTURE, (ev, ...args: boolean[] | string[]) => {
			loggerService().debug(`[WindowService] (${ SCREEN_CAPTURE })`);

			const [startScreenCapture, chartUrl] = args;

			if (typeof startScreenCapture !== 'boolean') {
				return;
			}

			this.isShowTabsPanelFullscreen = !startScreenCapture;

			if (typeof chartUrl !== 'string') {
				return;
			}
			if (startScreenCapture) {
				// WORKAROUND: we need to recreate main menu window when screen capture is stopped because of Electron bug
				mainMenuService().recreateMenuWindow();
			}
			this.chartWindows.forEach(wnd => {
				const chart = wnd.tabs.find(tab => tab.webContentsId() === ev.sender.id);
				if (chart) {
					chart.hasIdeaRecord = startScreenCapture;
				}
			});
		});

		ipcMain.on(OPEN_NEW_WINDOW, (ev, ...args: [string, number, number]) => {
			const [url, height, width] = args;
			loggerService().debug(`WindowService(): ipcMain(OPEN_NEW_WINDOW: height: ${ height }, width: ${ width }) ${ url }`);

			if (url == null || isPineEditorUrl(url) === false) {
				return;
			}

			const newWindowInfo: NewWindowInfo = {
				url,
			};

			if (width != null && height != null) {
				newWindowInfo.windowPreferences = {
					contentSize: {
						width,
						height,
					},
				};
			}

			this.newWindow(newWindowInfo);
		});

		ipcMain.on(FOCUS_PINE_EDITOR, (ev, hasFocus: boolean) => {
			this.chartWindows.forEach(wnd => {
				const chart = wnd.tabs.find(tab => {
					if (!tab.isBrowserViewValid()) {
						return false;
					}
					return tab.webContentsId() === ev.sender.id;
				});
				if (chart) {
					chart.hasFocusOnPineEditor = hasFocus;
				}
			});
		});

		ipcMain.handle(GET_TABBED_WINDOW_ID, ({ sender: { id } }) => {
			const wnd = this.getWindowByViewId(id);

			if (!wnd) {
				return;
			}

			return wnd.remoteServiceInstanceId;
		});

		webcontentTaskService();
	}

	get tokyoNightStatus(): boolean {
		return this.hasTokyoNight;
	}

	getMaxWindowsInSession(): number {
		return this.maxWindowsInSession;
	}

	public getTokyoNightStatus(): boolean {
		return this.hasTokyoNight;
	}

	public getCountWindows(): number {
		return this.defaultWindow && this.chartWindows.length === 0 ? 1 : this.chartWindows.length;
	}

	public isChartWindow(wndId: number): boolean {
		return this.chartWindows.findIndex((wnd) => wnd.windowRef.id === wndId) !== -1;
	}

	public getWindowByViewId(id: number): TabbedWindow | undefined {
		return this.chartWindows.find(wnd => wnd.tabs.some(tab => tab.isBrowserViewValid() && tab.webContentsId() === id));
	}

	public toggleTokyoNight(): void {
		this.tokyoNightSubject.next(!this.hasTokyoNight);
	}

	public getAllChartTabs(addChartsWithParams = false): TvTab[] {
		const isChartTab = (url: string): boolean => addChartsWithParams
			? isChartUrlWithParams(url) || isChartUrl(url)
			: isChartUrl(url);

		return this.chartWindows.flatMap((window) =>
			window.tabs
				.filter((tab) => Boolean(tab.url) && isChartTab(tab.url))
				.filter((tab): tab is TvTab => tab instanceof TvTab)
		);
	}

	getAllTabs(): Tab[] {
		return this.defaultWindow?.tabs ?? this.chartWindows.flatMap(wnd => wnd.tabs);
	}

	@logCall
	public checkAutoSave(): Promise<boolean> {
		const chartTabs = this.getAllChartTabs(true);
		const hasChartWithParams = chartTabs.find((chartTab) => isChartUrlWithParams(chartTab.url));

		if (hasChartWithParams !== undefined) {
			return Promise.resolve(false);
		}

		const chartTabWithValidView = chartTabs.find((chartTab) => chartTab.isBrowserViewValid());
		if (chartTabWithValidView !== undefined) {
			return chartTabWithValidView.isAutoSaveEnabled();
		}

		return Promise.resolve(false);
	}

	getRecordFlag(): boolean {
		return Boolean(this.chartWindows.find(wnd => Boolean(wnd.tabs.find(chart => Boolean(chart.hasIdeaRecord)))));
	}

	@logCall
	removeRecordFlagForAllCharts(): void {
		this.chartWindows.forEach(wnd => {
			const chart = wnd.tabs.find(tab => tab.url);
			if (chart) {
				chart.hasIdeaRecord = false;
			}
		});
	}

	@logCall
	public async saveAllChanges(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<void> {
		const unsavedChartTabs = this.collectUnsavedChartTabsPendingSave(beforeUnloadMessages);
		if (unsavedChartTabs.length === 0) {
			return;
		}

		loggerService().info('Start to save all layout changes');

		appEventService().setIsAutosaveInProgress(true);

		/**
		 * decisions are only ever emitted by the dialogs' renderers, so if every app-quit dialog dies
		 * without one (window destroyed by another teardown path, renderer crash) the decision await
		 * below would hang forever and leave the quit stuck; created lazily because the dialogs only
		 * exist once showDialog has run. One surviving dialog is enough to keep awaiting a real decision.
		 */
		let allDialogsGone: Promise<null> | null = null;
		const awaitAllDialogsGone = (): Promise<null> => {
			allDialogsGone ??= Promise.all(
				this.chartWindows
					.map((window) => window.saveChangesDialog)
					.map((dialog) => new Promise<void>((resolve) => {
						if (dialog === null || dialog.windowRef.isDestroyed()) {
							resolve();
							return;
						}

						dialog.windowRef.once('closed', () => resolve());
						dialog.windowRef.webContents.once('render-process-gone', () => resolve());
					}))
			)
				.then(() => null);

			return allDialogsGone;
		};

		const result = await runSaveChangesFlow({
			chartTabs: unsavedChartTabs,
			scopeType: APP_SAVE_SCOPE.type,
			// app quit drives one flow across every window's dialog under the shared app scope
			showDialog: async() => {
				await Promise.all(
					this.chartWindows.map((window) =>
						window.showSaveChangesDialog(APP_SAVE_SCOPE)
					)
				);
			},
			closeDialog: () => { this.closeAllSaveChangesDialog(); },
			setError: (hasError) => { this.saveChangesErrorSubject.next({ scopeId: APP_SAVE_SCOPE.id, hasError }); },
			awaitSaveChangesDecision: async() => {
				const decision = await Promise.race([
					awaitSaveChangesDecisionOnce(this.saveChangesDecisionSubject, APP_SAVE_SCOPE.id),
					awaitAllDialogsGone(),
				]);

				if (decision === null) {
					loggerService().warn('WindowService.saveAllChanges: every save-changes dialog is gone without a decision, cancelling the flow');
					return SaveChangesDecisionType.Cancel;
				}

				return decision;
			},
		});

		/**
		 * the dialog X aborts the quit (app keeps running); preserve that by rejecting so
		 * AppEventService.appQuit()'s .catch() stops the shutdown. Saved/Discarded fall through.
		 */
		if (result === SaveChangesFlowResult.Cancelled) {
			return Promise.reject('The user aborted the close');
		}
	}

	@logCall
	public closeAllSaveChangesDialog(): void {
		for (const appWnd of this.chartWindows) {
			if (appWnd.saveChangesDialog === null || appWnd.saveChangesDialog.windowRef.isDestroyed()) {
				continue;
			}

			appWnd.saveChangesDialog.closeSaveChangeDialog();
		}
	}

	@logCall
	public async changeTabParent(sourceWindow: TabbedWindow, destinationWindow: TabbedWindow, srcTabId: TabId, position?: number): Promise<void> {
		let detachedTabId: TabId | null = null;
		let error: unknown;

		try {
			detachedTabId = sourceWindow.detachTab(srcTabId);
		}
		catch (err) {
			error = err;
		}

		if (detachedTabId === null) {
			loggerService().error(`WindowService.changeTabParent(): "TabId: (${ shortifyId(srcTabId) }) does not exists on sourceWindow while attempt to changeTabParent"`, error);
			return;
		}

		loggerService().debug(`WindowService.changeTabParent(): "Window adds existing tab to position: ${ position ?? 0 }"`);

		await destinationWindow.acceptExistingTab(detachedTabId, position);
	}

	@logCall
	@authenticatedFeature
	public newWindow(params?: NewWindowInfo, options?: TabbedWindowOptions): TabbedWindow {
		const wnd = createTabbedEmptyWindow(options, params?.windowPreferences, this.getCascadePosition(params?.sourceWindow));

		this.chartWindows.push(wnd);

		let addTabPromise: Promise<TabId> | undefined;

		if (params?.tabId !== undefined) {
			addTabPromise = wnd.acceptExistingTab(params.tabId);
		}
		else {
			addTabPromise = wnd.createAndAddTab({ url: params?.url });
		}

		ignorePromise(addTabPromise.then((tabId: TabId) => {
			wnd.windowRef.moveTop();
			wnd.windowRef.focus();

			if (params?.linkNewTab === true && params.sourceTab !== undefined) {
				const success = linkingService().linkToSameGroup(params.sourceTab.id, tabId);
				if (!success) {
					loggerService().warn(`windowService.newWindow attempt to link unlinkable tabs with ids: ${ params.sourceTab.id }, ${ tabId }`);
				}
			}
		}));

		this.updateMaxWindowCount();
		this.chartWindowSubject.next(this.defaultWindow && this.chartWindows.length === 0 ? 1 : this.chartWindows.length);
		return wnd;
	}

	/**
	 * Renderer-facing wrapper around newWindow(): returns void so the result is serializable over
	 * the IPC proxy. newWindow() returns a TabbedWindow instance, which cannot be structured-cloned and
	 * therefore rejects the remote invocation when called via windowServiceProxy().
	 * Authentication is gated by newWindow()'s own @authenticatedFeature decorator.
	 */
	@logCall
	public openNewWindow(params?: NewWindowInfo, options?: TabbedWindowOptions): void {
		this.newWindow(params, options);
	}

	@logCall
	*getChartWindows(): Iterable<TabbedWindow> {
		if (this.chartWindows.length === 0 && this.defaultWindow) {
			yield this.defaultWindow;
		}

		for (const wnd of this.chartWindows) {
			yield wnd;
		}
	}

	@logCall
	public getDragElements(): string[] {
		const result = [];
		if (this.chartWindows.length === 0 && this.defaultWindow) {
			this.defaultWindow.tabs.forEach(tab => result.push(tab.remoteServiceInstanceId ?? ''));
			if (this.defaultWindow.tabPanelId) {
				result.push(this.defaultWindow.tabPanelId);
			}
			return result;
		}

		for (const wnd of this.chartWindows) {
			wnd.tabs.forEach(tab => result.push(tab.remoteServiceInstanceId ?? ''));
			if (wnd.tabPanelId) {
				result.push(wnd.tabPanelId);
			}
		}
		return result;
	}

	public getActiveWindowsBounds(): WindowBounds[] {
		const rectangles: WindowBounds[] = [];

		const isWindowActive = (wnd: TabbedWindow): boolean => {
			return wnd.getAllowMouseEvents() && !wnd.windowRef.isDestroyed() &&
				!(wnd.getWindowState() === WindowState.Minimized || wnd.getWindowState() === WindowState.Hidden);
		};

		const lastFocusedWindow = this.lastFocusedChartWindow ?? this.getLastFocusedWindow();

		if (this.chartWindows.length === 0 &&
			lastFocusedWindow &&
			isWindowActive(lastFocusedWindow)) {
			rectangles.push({ id: lastFocusedWindow.remoteServiceInstanceId, bounds: lastFocusedWindow.windowRef.getBounds() });
		}

		for (const wnd of this.chartWindows) {
			if (isWindowActive(wnd)) {
				rectangles.push({ id: wnd.remoteServiceInstanceId, bounds: wnd.windowRef.getBounds() });
			}
		}

		return rectangles;
	}

	findWindow(criteria: Partial<FindWindowCriteria>): TabbedWindow | undefined {
		const { refWindow, windowId, tabWebContents, tabId, windowPersistentId } = criteria;

		if (tabId) {
			return this.findWindowGeneric(w => !!w.tabs.find(t => t.id === tabId));
		}

		if (windowId) {
			return this.findWindowGeneric(w => w.remoteServiceInstanceId === windowId);
		}

		if (refWindow) {
			return this.findWindowGeneric(w => w.windowRef.id === refWindow.id);
		}

		if (tabWebContents) {
			return this.findWindowGeneric(w => !!w.tabs.find(t =>
				t.isBrowserViewValid() && t.webContentsId() === tabWebContents.id));
		}

		if (windowPersistentId) {
			return this.findWindowGeneric(w => w.persistentId === windowPersistentId);
		}
	}

	private findWindowGeneric(condition: (window: TabbedWindow) => boolean): TabbedWindow | undefined {
		const wnd = this.chartWindows.find(w => !w.windowRef.isDestroyed() && condition(w));
		if (wnd !== undefined) {
			return wnd;
		}

		if (this.defaultWindow && !this.defaultWindow.windowRef.isDestroyed() && condition(this.defaultWindow)) {
			return this.defaultWindow;
		}
	}

	getLastFocusedWindow(): TabbedWindow | undefined {
		if (this.lastFocusedChartWindow && !this.lastFocusedChartWindow.windowRef.isDestroyed()) {
			return this.lastFocusedChartWindow;
		}
		return this.chartWindows[0] ?? this.defaultWindow;
	}

	private updateLastFocusedWindow(wnd: BrowserWindow): void {
		const chartWindow = this.chartWindows.find(w => !w.windowRef.isDestroyed() && w.windowRef.id === wnd.id);

		if (!chartWindow) {
			return;
		}

		this.lastFocusedChartWindow = chartWindow;

		if (chartWindow.persistentId !== this.state.focusedWindowId) {
			this.state.focusedWindowId = chartWindow.persistentId;
		}

		this.setFirstWindow(chartWindow);
	}

	// reordering on focus to get correct hover matches during drag
	private setFirstWindow(tabbedWindow: TabbedWindow): void {
		const focusedIndex = this.chartWindows.findIndex((w) => w === tabbedWindow);

		if (focusedIndex !== 0) {
			this.chartWindows.splice(focusedIndex, 1);

			this.chartWindows.unshift(tabbedWindow);
		}
	}

	@logCall
	mayClose(): boolean {
		return !this.preventAppClose;
	}

	@logCall
	private collectUnsavedChartTabsPendingSave(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): TvTab[] {
		const chartTabs = this.getAllChartTabs();

		// collect all unsaved charts (no early exit) because all of them must be saved later;
		// the unsaved state comes from the quit attempt's single dispatch, not from a new one
		return collectChartTabsPendingSave(chartTabs)
			.filter((chartTab) => beforeUnloadMessages.get(chartTab) !== undefined);
	}

	@logCall
	public async shouldPreventCloseForUnsavedChanges(beforeUnloadMessages: ReadonlyMap<TvTab, string | undefined>): Promise<boolean> {
		const appChartTabs = this.getAllChartTabs(true);
		const isAppHasIdeaRecording = this.anyChartTabHasIdeaRecording(
			appChartTabs,
			appChartTabs.map((chartTab) => beforeUnloadMessages.get(chartTab)),
		);
		const autoSave = await this.checkAutoSave();

		for (const wnd of this.chartWindows) {
			if (wnd.windowRef.isDestroyed() || wnd.isClosed) {
				continue;
			}

			const chartTabs = wnd.getChartTabs();
			if (chartTabs.length === 0) {
				return false;
			}

			let windowCloseStatus: WindowCloseStatus;
			if (autoSave) {
				windowCloseStatus = await wnd.getCloseStatus(isAppHasIdeaRecording, CheckUnsavedChangesMode.Ask, beforeUnloadMessages);
			}
			else {
				windowCloseStatus = await wnd.getCloseStatus(true, CheckUnsavedChangesMode.Ask, beforeUnloadMessages);
			}

			if (!windowCloseStatus.mayClose) {
				return true;
			}

			if (windowCloseStatus.closeToAll) {
				return false;
			}
		}

		return false;
	}

	@logCall
	async zoom(to: number | ZoomDirection, hidePopup = false): Promise<number | undefined> {
		let zoom;
		if (typeof to === 'number') {
			this.zoomController.setZoomValue(to);
		}
		else {
			zoom = this.zoomController.stepZoom(to);
		}

		if (!hidePopup) {
			await this.zoomController.showZoom();
		}
		return zoom;
	}

	getZoomFactor(): number {
		return this.zoomController.getZoomValue();
	}

	@logCall
	getRendererReports(): Promise<unknown> {
		const reportPromises: Promise<unknown>[] = [];

		const createAndAddReports = (windows: TabbedWindow[]): void => {
			for (const win of windows) {
				if (!win.windowRef.isDestroyed()) {
					reportPromises.push(win.createReport());
				}
			}
		};

		createAndAddReports(this.chartWindows);

		if (this.defaultWindow) {
			reportPromises.push(this.defaultWindow.createReport());
		}

		return Promise.all(reportPromises);
	}

	@logCall
	restoreWindow(state: WindowUndoState): void {
		const wndOptions = getDefaultTabbedWindowOptions();
		const storedOptions = state.options;

		Object.assign(wndOptions, storedOptions);

		const wnd = createTabbedEmptyWindow(wndOptions);

		this.chartWindows.push(wnd);
		this.updateMaxWindowCount();

		const promise = wnd.applyState(state);

		if (promise instanceof Promise) {
			ignorePromise(promise.then(() => {
				wnd.windowRef.moveTop();
				wnd.windowRef.focus();

				state.linkedTabs.forEach(tab => {
					if (tab.linkGroupName === undefined) {
						return;
					}
					linkingService().assignGroup(tab.id, tab.linkGroupName);
				});
			}));
		}
	}

	broadcastChannel(channel: string, ...values: unknown[]): void {
		for (const wnd of this.getChartWindows()) {
			for (const tab of wnd.tabs) {
				if (tab.isBrowserViewValid()) {
					tab.send(channel, ...values);
				}
			}
		}
	}

	@logCall
	private async mergeAnonymousSession(): Promise<void> {
		if (!this.defaultWindow) {
			return;
		}

		await this.disposeDefaultWindow();

		if (this.chartWindows.length > 0) {
			return;
		}

		await this.spawnDefaultWindow();
		this.mergeSession(this.defaultWindow);
	}

	private mergeSession(currentWindow: TabbedWindow): void {
		for (const tab of currentWindow.tabs) {
			currentWindow.reloadTab(tab.id, true);
		}

		currentWindow.createAndAddTab({
			active: true,
			position: 0,
			url: getConfiguration().urls.chart,
			waitUntilLoad: true,
		})
			.catch((error) => {
				loggerService().error('WindowService.mergeSession(): currentWindow.createAndAddTab() error', error);
			});

		this.chartWindows.push(currentWindow);
		delete this.defaultWindow;
	}

	@logCall
	private async spawnDefaultWindow(display?: Electron.Display): Promise<void> {
		const showAndApplyBounds = (wnd: BrowserWindow): void => {
			if (display) {
				const [w, h] = wnd.getSize();
				const displayAlignedRect = centeredRect(display.bounds, w, h);
				wnd.setBounds(displayAlignedRect);
			}

			wnd.show();
		};

		if (this.defaultWindow && !this.defaultWindow.windowRef.isDestroyed()) {
			showAndApplyBounds(this.defaultWindow.windowRef);
			return;
		}

		try {
			const options = getDefaultTabbedWindowOptions();

			if (options.windowOptions) {
				options.windowOptions.show = false;
			}

			this.defaultWindow = createTabbedEmptyWindow(options);

			await this.defaultWindow.createAndAddTab({ waitUntilLoad: true });

			showAndApplyBounds(this.defaultWindow.windowRef);

			const isUserStorageExist = await persistenceService().checkUserStorageExistence();

			if (!isUserStorageExist && !isMSStore()) {
				userService().doSignIn('first_sign');
			}
		}
		catch (error) {
			loggerService().error('Failure while spawning default window', error);
		}
	}

	private getCascadePosition(window?: BrowserWindow): Rectangle | undefined {
		let wnd: BrowserWindow | null = window ?? BrowserWindow.getFocusedWindow();

		if (!window && wnd?.getParentWindow()) {
			wnd = wnd.getParentWindow();
		}

		if (!wnd || wnd.isDestroyed()) {
			return;
		}

		const bounds = wnd.getNormalBounds();

		return {
			x: bounds.x + WINDOW_HEADER_HEIGHT,
			y: bounds.y + WINDOW_HEADER_HEIGHT,
			width: bounds.width,
			height: bounds.height,
		};
	}

	@logCall
	private async disposeWindows(windows: TabbedWindow[]): Promise<void> {
		if (windows.length === 0) {
			return;
		}

		const selectedWindows = windows.splice(0, windows.length);
		await Promise.all(selectedWindows.map((wnd) => wnd.dispose()));
		delete this.lastFocusedChartWindow;
	}

	@logCall
	private async disposeDefaultWindow(): Promise<void> {
		if (this.defaultWindow) {
			await this.defaultWindow.dispose();
			delete this.defaultWindow;
		}
	}

	private setSecondInstanceFocusHandler(): void {
		app.on('second-instance', () => {
			loggerService().debug('Electron.App (second-instance): WindowServiceHandler');

			const wndToFocus: BrowserWindow | undefined = this.getLastFocusedWindow()?.windowRef;

			if (!wndToFocus || wndToFocus.isDestroyed()) {
				return;
			}

			if (wndToFocus.isMinimized()) {
				wndToFocus.restore();
			}

			wndToFocus.focus();
			wndToFocus.flashFrame(false);
		});
	}

	private deleteWindow(wnd: StatefulWindow): void {
		if (appEventService().isClosing()) {
			return;
		}

		const closingSingleDefaultWindow = wnd === this.defaultWindow && this.chartWindows.length === 0;

		if (closingSingleDefaultWindow && !this.preventAppClose) {
			this.notifyListeners(WindowServiceEvents.AllWindowsClosed, false);
			return;
		}

		// this.chartWindows array is empty when window closed/destroyed  during signout process (in this case index always be -1).
		const index = this.chartWindows.indexOf(wnd as TabbedWindow);
		if (index < 0) {
			return;
		}

		// Keep the last window to save it state.
		// BE AWARE: need to take into account that last window are actually closed (windowRef.isDestroyed() === true) !
		if (this.chartWindows.length === 1 && !this.preventAppClose) {
			this.notifyListeners(WindowServiceEvents.AllWindowsClosed, false);

			return;
		}

		const window = this.chartWindows.splice(index, 1)[0];
		this.chartWindowSubject.next(this.chartWindows.length);
		const state = { ...window.extractState() as WindowUndoState };
		state.linkedTabs = window.tabs.map((tab: Tab): WindowLinkedTabState => {
			return {
				id: tab.id,
				linkGroupName: linkingService().getGroupName(tab.id) ?? undefined,
			};
		});

		ignorePromise(window.dispose());

		if (window.isWindowWasClosedAfterTabDetach) {
			window.isWindowWasClosedAfterTabDetach = false;
			return;
		}

		const droppedEntry = mainService().undo.push({ command: 'window-closed', data: state });
		if (droppedEntry !== undefined) {
			sessionStorageService().getStorage().deleteSessions(getSetOfTabIdsFromUndoEntry(droppedEntry));
		}
	}

	private ensureWindowShow(): void {
		const wnd = this.chartWindows[0];

		if (wnd && wnd.getWindowState() === WindowState.Minimized) {
			wnd.windowRef.restore();
			wnd.windowRef.focus();
		}
	}

	private async onRestoreSession(): Promise<void> {
		await this.mergeAnonymousSession();

		if (this.chartWindows.length === 0) {
			this.newWindow();
			modifyWithoutNotifications(this, () => {
				this.state.focusedWindowId = this.chartWindows[0].persistentId;
			});
		}
		else {
			const focusedWnd = this.chartWindows.find(wnd => wnd.persistentId === this.state.focusedWindowId);
			focusedWnd?.windowRef?.focus();
		}

		this.notifyListeners(WindowServiceEvents.Initialize);

		performanceService().notify('Session restored');

		this.updateMaxWindowCount();

		const shouldShowOnboarding = appSettingsService().get('isFirstSuccessfullAuthAttempt') &&
			!getConfiguration().advanced.disableAppOnboarding &&
			!isMSStore();

		if (shouldShowOnboarding) {
			userService().showAppOnboardingDialog(AppOnboardingLaunchSource.AppFirstLaunch);
		}
	}

	private getAllRestoredTabIds(): string[] {
		return this.chartWindows.flatMap(window => window.tabs.map(tab => tab.id));
	}

	private cleanUnusedSessionStorage(): void {
		const keepIds = [
			...this.getAllRestoredTabIds(),
			...getSetOfTabIdsFromUndoEntries(mainService().undo.entries),
		];

		sessionStorageService().keepSessionsDuringFullCleanup(keepIds);
	}

	@logCall
	private async startAnonymousSession(): Promise<void> {
		await this.localeReadyPromise;

		const focusedWindow = BrowserWindow.getFocusedWindow();
		let display: Display | undefined;
		if (focusedWindow) {
			display = screen.getDisplayMatching(focusedWindow.getBounds());
		}

		this.preventAppClose = true;

		try {
			if (isSettingsWindowShown()) {
				closeSettingsWindow();
			}

			await this.disposeWindows(this.chartWindows);
			await tabManager().resetState();

			await this.spawnDefaultWindow(display);
		}
		finally {
			// a stuck latch would silently block every window close and app quit forever
			this.preventAppClose = false;
		}

		this.notifyListeners(WindowServiceEvents.Initialize);
		this.updateMaxWindowCount();
	}

	private async applyLocale(): Promise<void> {
		const tabPromises: (() => Promise<void>)[] = [];

		for (const window of this.chartWindows) {
			for (const tab of window.tabs) {
				if (tab.url && !isLocalURI(tab.url)) {
					const tabCloseStatus = await window.tryCloseTabs([tab], false, CheckUnsavedChangesMode.CheckOnly);

					if (tabCloseStatus.mayClose) {
						tabPromises.push(() => tab.reloadWithLocaleAwareness());
					}
				}

				tab.recreateTabContextMenu();
			}
		}

		if (tabPromises.length < 1) {
			return;
		}

		try {
			await unorderedPromiseAllSettled(tabPromises);
		}
		catch (err) {
			loggerService().error('Error at applying locale', err);
		}
	}

	recomputeFullscreenedWindowsBounds(isTabPanelHidden: boolean): void {
		for (const chartWnd of this.chartWindows) {
			if (!chartWnd.windowRef.isFullScreen()) {
				continue;
			}

			chartWnd.activeTab?.setBounds(chartWnd.computeViewBounds(isTabPanelHidden));
		}
	}

	private updateMaxWindowCount(): void {
		const chartWindowsCount = this.defaultWindow && this.chartWindows.length === 0 ? 1 : this.chartWindows.length;
		this.maxWindowsInSession = Math.max(chartWindowsCount, this.maxWindowsInSession);
	}

	public anyChartTabHasIdeaRecording(chartTabs: TvTab[], chartMessages: (string | undefined)[]): boolean {
		const isRecordingIdea = chartTabs.some((chartTab) => chartTab.hasIdeaRecord);
		const isIdeaPreviewOpened = chartMessages.some((message) => message === CHART_RECORD_IDEA_WARNING_MESSAGE);

		return isRecordingIdea || isIdeaPreviewOpened;
	}

	async dispose(): Promise<void> {
		this.cleanUnusedSessionStorage();
		this.preventAppClose = true;

		try {
			await this.disposeWindows(this.chartWindows);
			await this.disposeDefaultWindow();

			this.clearListeners();
		}
		finally {
			// a stuck latch would silently block every window close and app quit forever
			this.preventAppClose = false;
		}
	}
}

UndoStack.registerUndoHandler('window-closed', {
	undo(what: string, data: unknown): void {
		loggerService().debug('WindowService:Undo:RestoreWindow');
		windowService().restoreWindow(data as WindowUndoState);
	},

	undoItemDescription(): string {
		return i18n.t('Reopen closed window');
	},
});
