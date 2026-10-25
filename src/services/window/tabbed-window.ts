import '../../utils/array';
import { app, Event, Input, screen, WebContents } from 'electron';
import * as path from 'path';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { LinkGroupName, linkingService } from '../../linking';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId } from '../../logger/log-formatter';
import { networkService } from '../../main/network';
import { sessionStorageService } from '../../main/session-storage';
import { TabId, tabManager, UserTabGroupId } from '../../main/tab-manager';
import { formatLink } from '../../navigation/navigation-rules';
import { IPersistentObjectImplementation } from '../../persistence';
import { RendererData } from '../../tv-api';
import { getUID } from '../../tvd-runtime/core';
import {
	getPersistentChartUrl,
	ignorePromise,
	InputProcessor,
	isChartUrl,
	isChartUrlWithParams,
	isDarwin,
	isLinux,
	isLocalURI,
	isWin32,
	Position,
	Rectangle,
	UndoStack,
} from '../../utils';
import { askUserToCloseGroup, askUserToCloseOrToReloadUnsavedChart, askUserToCloseUnsavedChartTab, CloseOrReloadUnsavedChart } from '../../utils/dialog-window-helper';
import { bindHotkeyCommand } from '../../utils/hotkey-service';
import { getSetOfTabIdsFromUndoEntry } from '../../utils/undo-entry';
import { appSettingsService } from '../app-settings-service';
import { TABBED_WINDOW_EVENTS_CONTRACT, TABS_CONTAINER_CONTRACT } from '../contracts';
import { CHART_RECORD_IDEA_WARNING_MESSAGE, DEFAULT_TAB_TITLE, DEFAULT_TAB_URL, InputAcceptor, NO_TAB_URL } from '../interfaces';
import { localeService } from '../locale';
import i18n from '../locale/i18n';
import { userProfileUrl } from '../locale/locale-service';
import { mainMenuService } from '../main-menu-service';
import { mainService } from '../main-service';
import { defaultBounds, dragServiceProxy, IDragService } from '../native-drag-service';
import { isDragServiceReady } from '../native-drag-service/native-drag-configuration';
import { settingsProvider } from '../settings';
import { isSettingsWindowShown } from '../settings/settings-window';
import { themeManager } from '../settings/theme';
import { userService } from '../user';
import { AuthenticationHandler } from '../user/authentication-handler';
import { DialogWindow } from './dialog-window';
import { StatefulWindow } from './stateful-window';
import { awaitSaveChangesDecisionOnce, runSaveChangesFlow, SaveChangesFlowResult } from './tab/save-changes-flow';
import { SaveChangesDecisionType, SaveChangesScope, SaveChangesScopeType } from './tab/save-changes-types';
import { canFollowAutoSaveFlow, collectChartTabsPendingSave, dispatchBeforeUnloadToChartTabs } from './tab/shutdown-checks';
import { Tab, TabState } from './tab/tab';
import { TvTab } from './tab/tv-tab';
import {
	CloseTabOptions,
	CreateTabOptions,
	getLocaleBasedSaveChangesDialogSize,
	IRendererReporter,
	ITabbedWindowControl,
	ITabbedWindowEvents,
	ITabController,
	ITabsContainer,
	IWindowInputEvents,
	KeyboardEventData,
	MenuCloseEventSource,
	ReplaceTabOptions,
	SaveChangesDialog,
	TabView,
	TitleBarWindowData,
	WINDOW_HEADER_HEIGHT,
	WindowState,
	WindowStateBeforeFullscreen,
} from './window-api';
import { makeBrowserWindowOptions, TabbedWindowOptions } from './window-options';
import { WindowServiceEvents } from './with-listener';
import { CheckUnsavedChangesMode, WindowCloseStatus, windowService } from '.';

export type WindowId = string;

export interface TabClosedUndoData
	extends Omit<TabState, 'fullscreen'> {
	position: number;
	windowPid: WindowId;
	linkGroupName?: LinkGroupName;
}

export interface TabbedWindowState {
	persistentId: WindowId;
	activeGroupId: UserTabGroupId | null;
	options: TabbedWindowOptions;
	tabs: TabState[];
}

const TABBED_WINDOW_REMOTE_CONTRACT = 'tvd:tabbed-window';

@logCallName('TabbedWindowBase')
export class TabbedWindowBase
	extends StatefulWindow
	implements ITabbedWindowControl, IPersistentObjectImplementation, InputAcceptor, IWindowInputEvents {
	// to enforce consistency
	static readonly defaultWindowHeaderHeight = WINDOW_HEADER_HEIGHT;
	lastMouseCoordinates: Position = { x: 0, y: 0 };
	tabPanelId?: string;

	private activeGroupId: UserTabGroupId | null = null;

	readonly remoteServiceInstanceId: string;

	private windowPersistentId: WindowId = getUID();
	private readonly options: TabbedWindowOptions;

	private readonly notifyInputEventTypes: { [key: string]: 'char' | 'keyDown' | 'keyUp'; } = {
		keypress: 'char',
		keydown: 'keyDown',
		keyup: 'keyUp',
	};

	private isAllowDragEvents = true;

	// tabsContainer can be initialized only after window's content is loaded (i.e. renderer will be inititalized).
	// But while it is not initialized yet there is can be an tabs update related events that must be raised when tabsContainer is going to be ready.
	// For that purposes tabsContainerPromise must be used not a direct access to the tabsContainer instance.
	private tabsContainer?: ITabsContainer;
	protected windowEventsReceiver?: Promisify<ITabbedWindowEvents>;

	private isDisposed = false;
	private inputProcessor = new InputProcessor(this);

	private notifyContainerTabsChanged = true;
	private beforeCloseStateSnapshot: TabbedWindowState | null = null;

	private loadingTabs = new Map<string, Subscription>();

	private readonly isWindowFocusedEvent = new BehaviorSubject<boolean>(true);
	readonly isWindowFocusedChange = this.isWindowFocusedEvent.asObservable();

	private readonly windowLoadingSubject = new BehaviorSubject<boolean>(true);
	readonly windowLoadingChange = this.windowLoadingSubject.asObservable();

	private readonly windowDisposeSubject = new Subject<void>();
	readonly windowDisposeChange = this.windowDisposeSubject.asObservable();

	private readonly menuCloseEventSubject = new Subject<MenuCloseEventSource>();
	readonly menuCloseEvent = this.menuCloseEventSubject.asObservable();

	protected tabsPanelShow = false;
	panelDelayedTimeout?: NodeJS.Timeout;

	private boundsBeforeMaximize?: Partial<Electron.Rectangle>;

	public saveChangesDialog: DialogWindow | null = null;

	private chartTabsPendingSave: readonly TvTab[] = [];
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	private widthSaveChangesDialog = 350;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	private heightSaveChangesDialog = 220;

	private stateBeforeFullscreen?: WindowStateBeforeFullscreen;
	private isWindowWasClosedAfterDetachOfTab = false;

	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	tabsPanelShowDelay = 500;

	static defaultContentViewFrameOffset(): Rectangle {
		return {
			width: 0,
			height: TabbedWindowBase.defaultWindowHeaderHeight,
			x: 0,
			y: TabbedWindowBase.defaultWindowHeaderHeight,
		};
	}

	constructor(options: TabbedWindowOptions) {
		super(makeBrowserWindowOptions(options), path.join(app.getAppPath(), 'app/window', './index.html'));
		loggerService().info('Created base window, tweaking current window');

		tabManager().createDefaultGroup(this.persistentId);

		this.remoteServiceInstanceId = IpcServices.registerRemoteObject(this, TABBED_WINDOW_REMOTE_CONTRACT);

		this.options = options;
		this.supportAreaHover = options.titleBarOptions?.showTabs ?? this.supportAreaHover;

		this.windowRef
			.on('focus', () => {
				this.isWindowFocusedEvent.next(true);
			})
			.on('blur', () => {
				this.isWindowFocusedEvent.next(false);
			})
			.on('close', () => {
				this.triggerMenuCloseEvent('window-closed');
			});

		this.addDisposable(
			Tab.titleChange.subscribe((tab): void => {
				const activeTab = this.activeTab;
				if (activeTab !== null && activeTab === tab) {
					this.updateWindowTitle();
				}
			})
		);

		this.windowRef.webContents
			.on('before-input-event', (ev: Event, input: Input) => {
				this.acceptInput(ev, input);
			});

		this.addDisposable(
			themeManager().themeChange.subscribe(() => {
				this.applyTabsTheme();
			})
		);

		this.initSubscribesForSaveChangesDialog();
	}

	@logCall
	public override async dispose(): Promise<void> {
		if (this.isDisposed || this.windowRef.isDestroyed()) {
			return;
		}

		this.notifyListeners(WindowServiceEvents.Dispose);
		this.isDisposed = true;

		if (this.tabPanelId !== undefined && isDragServiceReady()) {
			await dragServiceProxy().unregister(this.tabPanelId);
		}

		for (const sub of this.loadingTabs.values()) {
			sub.unsubscribe();
		}

		if (this.remoteServiceInstanceId !== '') {
			IpcServices.unregisterRemoteObject(this.remoteServiceInstanceId);
		}

		this.saveChangesDialog?.dispose();

		super.dispose();

		tabManager().resetUserGroupWindowAssignment(this.persistentId);
		tabManager().deleteDefaultGroup(this.persistentId);
	}

	@logCall
	public override internalExtractState(): TabbedWindowState {
		return this.beforeCloseStateSnapshot !== null ? this.beforeCloseStateSnapshot : this.makeStateSnapshot();
	}

	@logCall
	public override async internalApplyState(state: TabbedWindowState): Promise<void> {
		tabManager().deleteDefaultGroup(this.persistentId);

		this.windowPersistentId = state.persistentId;

		if (tabManager().getDefaultGroup(this.persistentId) === null) {
			tabManager().createDefaultGroup(this.persistentId);
		}

		if (
			state.activeGroupId !== null &&
			tabManager().getUserGroup(state.activeGroupId) !== null
		) {
			this.activeGroupId = state.activeGroupId;
		}
		else {
			this.activeGroupId = null;

			const defaultGroupTabs = tabManager().getDefaultGroupTabs(this.persistentId);
			if (defaultGroupTabs.length === 0 && state.tabs.length > 0) {
				for (const tabState of state.tabs) {
					tabManager().createTab(
						{ ...tabState, id: tabState.persistentId },
						this.persistentId,
					);
				}
			}
		}

		await this.load();

		for (const tab of this.tabs) {
			this.handleTabLoading(tab);

			if (tab.url && tab.url !== NO_TAB_URL) {
				const localizedUrl = this.localizeURL(tab.url);
				tab.load(localizedUrl, this.remoteServiceInstanceId)
					.catch((error) => {
						loggerService().error(`TabbedWindowBase.internalApplyState: tab ${ tab.id } (url: ${ tab.url }) load error`, error);
					});
			}
		}

		if (this.tabs.length === 0) {
			loggerService().warn('TabbedWindowBase.internalApplyState() with empty state');
			this.createAndAddTab({ focus: false })
				.catch((error) => {
					loggerService().error('TabbedWindowBase.internalApplyState(): createAndAddTab() error', error);
				});
		}

		this.updateTabsContainer();
		this.restoreWindowState();

		const activeTab = this.activeTab;
		if (activeTab !== null) {
			this.setActiveTab(activeTab);

			if (activeTab.isFullscreened) {
				try {
					await activeTab.executeJavaScript('window.TradingViewApi.startFullscreen()');
				}
				catch (err) {
					loggerService().error('[TabbedWindow.internalApplyState()] Failed to set active tab fullscreen');
				}
			}
		}
	}

	private get effectiveGroupId(): string {
		return this.activeGroupId ?? this.persistentId;
	}

	public get tabs(): Tab[] {
		try {
			return this.activeGroupId !== null
				? tabManager().getUserGroupTabs(this.activeGroupId)
				: tabManager().getDefaultGroupTabs(this.persistentId);
		}
		catch (error) {
			loggerService().error('[TabbedWindowBase]: Failed to get tabs for active group', error);
			return [];
		}
	}

	private applyTabsTheme(): void {
		const canApplyTheme = (url: string): boolean => {
			return isChartUrl(url) || isLocalURI(url);
		};

		for (const tab of this.tabs) {
			if (!tab.isBrowserViewValid()) {
				continue;
			}

			if (canApplyTheme(tab.getURL())) {
				tab.applyTheme();
			}
			else {
				ignorePromise(tab.reload());
			}
		}
	}

	private updateWindowTitle(): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}

		const activeTab = this.activeTab;
		if (activeTab === null) {
			return;
		}

		const formatTitle = (title: RendererData): string => {
			if (!title.symbol) {
				return title.name;
			}

			if (isDarwin()) {
				return `${ title.symbol } / ${ title.name }`;
			}

			const changeSign = title.changeSign > 0 ? '\u25B2' : '\u25BC';

			return `${ title.symbol } ${ changeSign } ${ title.last ?? '' } ${ title.changePercent } / ${ title.name }`;
		};

		const title = typeof activeTab.title === 'string' ? activeTab.title : formatTitle(activeTab.title);

		if (isDarwin() && title === this.windowRef.getTitle()) {
			return;
		}

		this.windowRef.setTitle(title);
	}

	computeViewBounds(fullscreened: boolean): Rectangle {
		if (this.windowRef.isDestroyed()) {
			return defaultBounds;
		}

		const contentBounds = this.windowRef.getContentBounds();

		const headerHeight = fullscreened && !this.tabsPanelShow ? 0 : TabbedWindowBase.defaultWindowHeaderHeight;
		if (this.windowRef.isMaximized() && (!this.windowRef.isFullScreen() || this.tabsPanelShow)) {
			const display = screen.getDisplayMatching(contentBounds);
			const displayWorkAreas = display.workArea;

			const ofsX = isLinux() ? 0 : contentBounds.x - displayWorkAreas.x;
			const ofsY = contentBounds.y - displayWorkAreas.y;

			const maximizedViewBounds: Rectangle = {
				x: ofsX,
				y: headerHeight,
				width: contentBounds.width,
				height: contentBounds.height - (headerHeight - (isLinux() ? 0 : ofsY)),
			};

			return maximizedViewBounds;
		}

		const bounds: Rectangle = {
			x: 0,
			y: headerHeight,
			width: contentBounds.width,
			height: contentBounds.height - headerHeight,
		};

		return bounds;
	}

	@logCall
	private makeStateSnapshot(): TabbedWindowState {
		if (this.windowRef.isDestroyed()) {
			loggerService().warn(`Attempt to _makeStateSnapshot, but window is destroyed, window id:(${ this.remoteServiceInstanceId })`);
		}

		const options = Object.assign({}, this.options);
		if (!options.windowOptions) {
			options.windowOptions = {};
		}

		let bounds: Partial<Rectangle> = {};
		if (!this.windowRef.isDestroyed()) {
			// getNormalBounds() has a bug when called in fullscreen mode on macOS returns the wrong size and position of the window
			bounds = isDarwin() ? this.windowRef.getBounds() : this.windowRef.getNormalBounds();
		}

		Object.assign(options.windowOptions, bounds);
		options.windowOptions.state = this.getWindowState();
		options.windowOptions.stateBeforeFullscreen = this.stateBeforeFullscreen;
		options.windowOptions.show = true;

		const tabs: TabState[] = this.tabs.map((tab) => {
			let { title, url } = tab.state;

			try {
				url = getPersistentChartUrl(tab.state.url);
			}
			catch (error) {
				loggerService().error('TabbedWindowBase.makeStateSnapshot(): getPersistentChartUrl() error', error);

				title = DEFAULT_TAB_TITLE;
				url = DEFAULT_TAB_URL;
			}

			return { ...tab.state, title, url };
		});

		return {
			persistentId: this.windowPersistentId,
			activeGroupId: this.activeGroupId,
			options,
			tabs,
		};
	}

	get persistentId(): WindowId {
		return this.windowPersistentId;
	}

	public getWindowId(): string {
		return this.remoteServiceInstanceId;
	}

	@bindHotkeyCommand('show-settings')
	private showSettings(): void {
		settingsProvider().showSettings();
	}

	@bindHotkeyCommand('set-full-screen')
	toggleFullscreen(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling toggleFullscreen on window that was destroyed');
			return;
		}

		if (this.windowRef.isFullScreenable()) {
			this.tabsPanelShow = false;
			const isFullScreen = this.windowRef.isFullScreen();
			const wndState = this.getWindowState();

			if (wndState !== WindowState.Fullscreen && wndState !== WindowState.FullscreenWithPanel) {
				this.stateBeforeFullscreen = wndState;
			}

			this.windowRef.setFullScreen(!isFullScreen);

			if (isFullScreen && this.stateBeforeFullscreen === WindowState.Maximized) {
				this.maximize();
			}
		}
	}

	@logCall
	toggleMaximize(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling toggleMaximize on window that was destroyed');
			return;
		}

		if (this.windowRef.isMaximized()) {
			if (isDarwin() && this.boundsBeforeMaximize) {
				this.windowRef.setBounds(this.boundsBeforeMaximize, true);
			}
			this.windowRef.unmaximize();
		}
		else {
			if (isDarwin()) {
				this.boundsBeforeMaximize = this.windowRef.getBounds();
			}

			this.maximize();
		}
	}

	@logCall
	toggleMinimize(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling toggleMinimize on window that was destroyed');
			return;
		}

		if (this.windowRef.isMinimized()) {
			this.windowRef.restore();
		}
		else {
			this.windowRef.minimize();
		}
	}

	@logCall
	public getWindowStateAsync(): WindowState {
		return this.getWindowState();
	}

	@logCall
	bringToFront(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling bringToFront on window that was destroyed');
			return;
		}

		if (!this.windowRef.isFocused()) {
			this.windowRef.focus();
		}
	}

	// on the compiled msix application, a bug with the .focus () method - the application does not pop up in all windows
	// there is issue on github https://github.com/electron/electron/issues/2867
	@logCall
	bringOnTop(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling bringOnTop on window that was destroyed');
			return;
		}

		this.windowRef.setAlwaysOnTop(true);
		this.windowRef.setAlwaysOnTop(false);
	}

	public getWindowBounds(): Rectangle {
		if (this.windowRef.isDestroyed()) {
			throw new Error('Calling getWindowBounds on window that was destroyed');
		}

		return this.windowRef.getBounds();
	}

	@logCall
	public async acceptExistingTab(tabId: TabId, position?: number): Promise<TabId> {
		if (this.isClosing) {
			throw new Error('TabbedWindowBase.acceptExistingTab: called for a window that is being closed');
		}

		tabManager().assignTabToGroup(tabId, this.effectiveGroupId, position);

		const tab = tabManager().getTab(tabId);
		if (tab === null) {
			throw new Error(`TabbedWindowBase.acceptExistingTab: tab ${ tabId } was not found after assignment`);
		}

		this.setActiveTab(tab);

		this.handleTabLoading(tab);

		await this.load();

		return tab.id;
	}

	public findTabById(tabId: TabId): Tab | null {
		loggerService().debug(`TabbedWindowBase.findTabById(tabId: ${ shortifyId(tabId) })`);

		return this.tabs.find((tab) => tab.id === tabId) ?? null;
	}

	@logCall
	public findTabByWebContents(webContents: WebContents): Tab | null {
		return this.tabs.find((tab) => tab.isBrowserViewValid() && tab.webContentsId() === webContents.id) ?? null;
	}

	@logCall
	public async createAndAddTab(options: CreateTabOptions): Promise<TabId> {
		if (this.isClosing) {
			throw new Error('addTab called for window that is being closed');
		}

		if (!this.isReady) {
			await this.load();
		}

		const tab = tabManager().createTab(options, this.effectiveGroupId);

		this.handleTabLoading(tab);

		if (tab.active) {
			this.setActiveTab(tab, false);
		}

		this.notifyTabsChanged();

		const url = tab.url;
		if (url !== '' && url !== NO_TAB_URL) {
			const localizedActualUrl = this.localizeURL(url);

			const loadTask = tab.load(localizedActualUrl, this.remoteServiceInstanceId);

			if (options.waitUntilLoad) {
				await loadTask;
			}
		}

		return tab.id;
	}

	@logCall
	async replaceTab(options: ReplaceTabOptions): Promise<void> {
		const position = this.getTabIndex(options.id);
		if (position === -1) {
			return;
		}

		const { id, title, pinned, url } = options;

		this.notifyContainerTabsChanged = false;

		try {
			await this.createAndAddTab({ title, pinned, url, position });
			await this.closeTab(id, { silent: false, addToHistory: false });
		}
		catch (error) {
			loggerService().error('TabbedWindow.replaceTab() failed', error);
			return;
		}

		this.notifyContainerTabsChanged = true;
		this.updateTabsContainer();
	}

	@logCall
	public getTabIndex(tabId: TabId): number {
		return this.tabs.findIndex(({ id }) => id === tabId);
	}

	@logCall
	private async closeTabsExcept(aliveTabs: Tab[]): Promise<void> {
		const closeTabs = (tabs: Tab[]): void => {
			tabs.forEach(({ id, url }) => {
				this.closeTab(id, { silent: true })
					.catch((error) => {
						loggerService().error(`TabbedWindowBase.closeTabsExcept(): this.closeTab(url: ${ url ?? 'url is undefined' }) error`, error);
					});
			});
		};

		try {
			const tabsToClose = this.tabs.except(aliveTabs);

			const closeStatus = await this.tryCloseTabs(tabsToClose, true);

			if (closeStatus.mayClose || closeStatus.closeToAll || !closeStatus.closeForbiddenTabId) {
				closeTabs(tabsToClose);
				return;
			}

			const tabIndex = tabsToClose.findIndex(t => t.id === closeStatus.closeForbiddenTabId);

			if (tabIndex < 0) {
				loggerService().warn(`Tab ${ closeStatus.closeForbiddenTabId } cancelled close while already closed`);
				return;
			}

			aliveTabs.push(...tabsToClose.slice(tabIndex));

			closeTabs(this.tabs.except(aliveTabs));
		}
		catch (error) {
			loggerService().error('[TabbedWindowBase.closeOtherTabs()] Failure while tab closing', error);
		}
		finally {
			this.notifyTabsChanged();
		}
	}

	@logCall
	protected async closeOtherTabs(tabId: TabId): Promise<void> {
		const aliveTabs: Tab[] = this.tabs.filter(({ id, pinned }) => pinned || id === tabId);

		if (this.tabs.length === aliveTabs.length) {
			return;
		}

		await this.closeTabsExcept(aliveTabs);
	}

	@logCall
	protected async closeTabsToTheRight(tabId: TabId): Promise<void> {
		const clickedTabIndex = this.getTabIndex(tabId);
		const firstUnpinnedTab = this.tabs.findIndex(({ pinned }) => !pinned);

		if (firstUnpinnedTab === -1) {
			return;
		}

		const aliveTabs = clickedTabIndex >= firstUnpinnedTab
			? this.tabs.slice(0, clickedTabIndex + 1)
			: this.tabs.filter(({ pinned }) => pinned);

		await this.closeTabsExcept(aliveTabs);
	}

	public get activeTab(): Tab | null {
		return this.tabs.find((tab) => tab.active) ?? null;
	}

	public get activeTabId(): string | null {
		return this.activeTab?.id ?? null;
	}

	private initSubscribesForSaveChangesDialog(): void {
		if (!isDarwin()) {
			return;
		}

		localeService().localeChange.subscribe((locale: string) => {
			const { width, height } = getLocaleBasedSaveChangesDialogSize(locale);

			this.widthSaveChangesDialog = width;
			this.heightSaveChangesDialog = height;
		});
	}

	@logCall
	public disposeSaveChangesDialog(): void {
		if (this.saveChangesDialog !== null) {
			this.saveChangesDialog.dispose();
			this.saveChangesDialog.windowRef.destroy();
			this.saveChangesDialog = null;
		}
	}

	private async initializeSaveChangesDialogWindow(scope: SaveChangesScope): Promise<void> {
		const wnd = this.windowRef;
		const dialog = new SaveChangesDialog(scope);
		let [width, height] = wnd.getSize();
		const isMaximized = !isDarwin() && wnd.isMaximized();

		if (isMaximized && isWin32()) {
			width = this.widthSaveChangesDialog;
			height = this.heightSaveChangesDialog;
		}

		this.saveChangesDialog = await DialogWindow.createDialogWindow({
			data: dialog,
			size: {
				width: isDarwin() ? this.widthSaveChangesDialog : width,
				height: isDarwin() ? this.heightSaveChangesDialog : height,
			},
			parentWindow: wnd,
			isModal: isDarwin(),
			isShow: false,
			isTransparent: true,
		});

		if (isMaximized && !isDarwin()) {
			this.saveChangesDialog.maximize();
		}
	}

	@logCall
	public async showSaveChangesDialog(scope: SaveChangesScope): Promise<void> {
		if (scope.type === SaveChangesScopeType.Debug) {
			return;
		}

		const hasSaveDialog = Boolean(this.saveChangesDialog);

		loggerService().debug(
			`TabbedWindowBase.showSaveChangesDialog():
				hasSaveDialog = ${ hasSaveDialog };
				scopeType = ${ scope.type }; scopeId = ${ scope.id }`
		);

		if (!hasSaveDialog) {
			const wnd = this.windowRef;
			if (wnd.isMinimized()) {
				if (!isDarwin()) {
					wnd.show();
					// Fixed bug Electron on Windows
					// App window opens under windows of some apps when we try to show our app window using Windows taskbar
					wnd.setAlwaysOnTop(true);
					wnd.setAlwaysOnTop(false);
				}
			}

			await this.initializeSaveChangesDialogWindow(scope);
		}

		this.saveChangesDialog?.show();
	}

	/**
	 *
	 */
	@logCall
	public async closeTab(tabId: TabId, { silent = false, addToHistory = true }: CloseTabOptions = {}): Promise<void> {
		loggerService().info(`Close tab, id: '${ shortifyId(tabId) }', from window id: '${ shortifyId(this.remoteServiceInstanceId) }'`);

		const tabIndex = this.getTabIndex(tabId);
		if (tabIndex < 0) {
			loggerService().warn(`TabbedWindowBase().closeTab(): "Invalid tab id: '${ shortifyId(tabId) }'"`);
			return;
		}

		const tab = this.tabs[tabIndex];
		if (!tab) {
			return;
		}

		if (tab.isCloseBlocked) {
			loggerService().warn(`TabbedWindowBase().closeTab(): "Tab is already in the process of closing, tab id: '${ shortifyId(tabId) }'"`);
			return;
		}

		const lastTabClosed = this.tabs.length === 1;
		if (lastTabClosed) {
			this.close();
			return;
		}

		if (!addToHistory) {
			this.loadingTabs.get(tab.id)?.unsubscribe();
			tabManager().closeTab(tabId);
			if (this.tabs.length > 0) {
				this.notifyTabsChanged();
			}
			return;
		}

		if (!silent) {
			const tabClosingStatus = await this.tryCloseTabs([tab]);

			if (tab.url && !tabClosingStatus.mayClose) {
				return;
			}
		}

		const newActiveTab = tab.active && !lastTabClosed
			? this.tabs[tabIndex === 0 ? 1 : tabIndex - 1]
			: null;

		if (tab.url) {
			const undoData: TabClosedUndoData = {
				windowPid: this.persistentId,
				position: tabIndex,
				persistentId: tab.id,
				active: tab.active,
				title: isLocalURI(tab.url) ? tab.title : DEFAULT_TAB_TITLE,
				pinned: tab.pinned,
				url: formatLink(tab.url),
				symbol: appSettingsService().get('saveSymbolInterval') ? (tab as TvTab).currentLayout : '',
				watchlist: (tab as TvTab).watchlist,
				linkGroupName: linkingService().getGroupName(tab.id) ?? undefined,
			};

			if (tab.errorState) {
				undoData.url = formatLink(tab.errorState.failedUrl);
				undoData.title = tab.errorState.title;
			}

			const droppedEntry = mainService().undo.push({ command: 'tab-closed', data: undoData });
			if (droppedEntry !== undefined) {
				sessionStorageService().getStorage().deleteSessions(getSetOfTabIdsFromUndoEntry(droppedEntry));
			}
		}

		this.loadingTabs.get(tab.id)?.unsubscribe();

		tabManager().closeTab(tabId);

		if (this.tabs.length === 0) {
			this.close();
			return;
		}

		if (newActiveTab !== null) {
			this.setActiveTab(newActiveTab);
		}

		if (this.tabs.length > 0) {
			this.notifyTabsChanged();
		}
		else if (!this.isClosing) {
			loggerService().warn('TabbedWindowBase().closeTab(): "Seems invalid behavior - no more tabs, but window is not closing"');
		}
	}

	@logCall
	public async duplicateTab(tabId: TabId): Promise<void> {
		const tab = this.findTabById(tabId);
		if (tab === null) {
			return;
		}

		const newTabId = getUID();
		await sessionStorageService().getStorage().cloneSession(tabId, newTabId);

		await this.createAndAddTab({
			title: tab.errorState?.title ?? tab.title,
			url: formatLink(tab.errorState?.failedUrl ?? tab.url ?? ''),
			position: this.getTabIndex(tab.id) + 1,
			focus: true,
			id: newTabId,
		});
	}

	@logCall
	public changeTab(tabId: TabId): void {
		if (this.isClosing) {
			loggerService().error('changeTab called for window that is being closed');
			return;
		}

		const tab = this.findTabById(tabId);
		if (tab === null || tab.active) {
			return;
		}

		this.setActiveTab(tab);
	}

	@logCall
	public moveTab(oldIndex: number, newIndex: number): void {
		if (this.isClosing) {
			throw new Error('moveTab called for window that is being closed');
		}

		tabManager().reorderTabInGroup(this.effectiveGroupId, oldIndex, newIndex);

		this.notifyTabsChanged();
	}

	@logCall
	public async togglePinnedTab(tabId: TabId, pinned: boolean): Promise<void | never> {
		if (this.isClosing) {
			throw new Error('togglePinnedTab called for window that is being closed');
		}

		if (!this.isReady) {
			await this.load();
		}

		const tabIndex = this.getTabIndex(tabId);
		if (tabIndex !== -1) {
			const firstUnpinnedTabIndex = this.tabs.findIndex((tab) => !tab.pinned);
			const tabToToggle = this.tabs[tabIndex];
			tabToToggle.pinned = pinned;

			const normalizedNewTabIndex = pinned ? firstUnpinnedTabIndex : firstUnpinnedTabIndex - 1;
			if (tabIndex !== normalizedNewTabIndex) {
				let newIndex: number;

				if (firstUnpinnedTabIndex !== -1) {
					newIndex = pinned ? firstUnpinnedTabIndex : normalizedNewTabIndex;
				}
				else {
					newIndex = pinned ? 0 : this.tabs.length - 1;
				}

				this.moveTab(tabIndex, newIndex);
			}

			this.notifyTabsChanged();
		}

		return Promise.resolve();
	}

	@logCall
	public detachTab(tabId: TabId): TabId | null {
		const detachedTabId = this.detachTabImpl(tabId);
		if (detachedTabId === null) {
			loggerService().error('TabbedWindowBase.detachTab: Error on detaching tab', new Error(`Tab does not belong to this window: ${ tabId }`));
			return null;
		}
		this.notifyTabsChanged(true);

		if (this.tabs.length === 0) {
			// without setTimeout sourceWindow.close() causes the application to crash on mac OS
			// without setTimeout destinationWindow.setActiveTab(tab) there is infinite spinner on mac OS
			const closeWindowTimeout = 10;
			setTimeout(() => {
				this.isWindowWasClosedAfterTabDetach = true;
				this.close();
			}, closeWindowTimeout);
		}

		return detachedTabId;
	}

	@logCall
	public resetTabs(): void {
		this.tabs.forEach(t => {
			t.offset = undefined;
			t.width = undefined;
		});
		this.notifyTabsChanged();
	}

	@logCall
	private detachTabImpl(tabId: TabId): TabId | null {
		if (this.isClosing) {
			throw new Error('detachTabImpl is called for a window that is being closed');
		}

		const tabIndex = this.getTabIndex(tabId);
		if (tabIndex < 0) {
			return null;
		}

		if (this.tabs.length > 1) {
			const nextActiveTab = this.tabs[tabIndex - 1] ? this.tabs[tabIndex - 1] : this.tabs[tabIndex + 1];
			this.setActiveTab(nextActiveTab);
		}

		this.loadingTabs.get(tabId)?.unsubscribe();

		const tab = tabManager().getTab(tabId);
		tabManager().unassignTabFromGroup(tabId);
		tab?.resetController();

		return tab?.id ?? null;
	}

	@logCall
	public reloadTab(tabId: TabId, hasNewLocale?: boolean): void {
		const tab = this.findTabById(tabId) ?? this.tabs[0];

		(tab as TvTab).currentLayout = undefined;

		ignorePromise(hasNewLocale ? tab.reloadWithLocaleAwareness() : tab.reload());
	}

	@logCall
	registerTabPanel(id: string): void {
		this.tabPanelId = id;
	}

	@logCall
	public registerTabController(tabId: TabId, remoteTabServiceInstanceId: string): void {
		loggerService().info(`TabbedWindowBase.registerTabController(tabId: ${ tabId }, from window id: ${ remoteTabServiceInstanceId })`);

		const tab = this.findTabById(tabId);
		if (tab === null) {
			loggerService().error(`[TabbedWindowBase.registerTabController()] Tab ${ tabId } not found in the window`);
			return;
		}

		const controller = IpcServices.provideProxy<ITabController>(remoteTabServiceInstanceId, this.windowRef.webContents.id);

		if (tab.remoteServiceInstanceId && isDragServiceReady()) {
			ignorePromise(dragServiceProxy().unregister(tab.remoteServiceInstanceId));
			IpcServices.unregisterRemoteObject(tab.remoteServiceInstanceId);
		}

		tab.remoteServiceInstanceId = remoteTabServiceInstanceId;

		tab.setController(controller);
	}

	// eslint-disable-next-line accessor-pairs
	set allowMouseEvents(value: boolean) {
		this.isAllowDragEvents = value;
	}

	disposed(): boolean {
		return this.isDisposed;
	}

	public getAllowMouseEvents(): boolean {
		return this.isAllowDragEvents;
	}

	@logCall
	async createReport(): Promise<unknown> {
		if (!this.windowEventsReceiver || this.windowRef.isDestroyed()) {
			return;
		}

		return {
			title: this.windowRef.getTitle(),
			report: await (this.windowEventsReceiver as unknown as IRendererReporter).getReport(),
		};
	}

	protected override onFinishLoad(): void {
		loggerService().info(`Window finished load id: '${ shortifyId(this.remoteServiceInstanceId) }'`);

		this.appReady = true;

		if (this.options.titleBarOptions?.showTabs) {
			this.tabsContainer = IpcServices.provideProxy<ITabsContainer>(TABS_CONTAINER_CONTRACT, this.windowRef.webContents.id);
		}

		this.windowEventsReceiver = IpcServices.provideProxy<ITabbedWindowEvents>(TABBED_WINDOW_EVENTS_CONTRACT, this.windowRef.webContents.id);
		this.windowEventsReceiver.initialize();

		this.notifyTabsChanged();

		if (!this.windowRef.isDestroyed() && !this.windowRef.isVisible()) {
			this.show();
		}
	}

	protected override onStartLoad(): void {
		delete this.tabsContainer;
		delete this.windowEventsReceiver;
	}

	protected override get rendererInitialData(): TitleBarWindowData {
		return {
			remoteServiceInstanceId: this.remoteServiceInstanceId,
			titleBarOptions: this.options.titleBarOptions ?? {},
		};
	}

	@logCall
	public hasChartUrlWithQueryParams(tabs: Tab[] = this.tabs): boolean {
		return tabs.some((tab) => {
			if (!tab.isBrowserViewValid()) {
				return false;
			}

			if (tab.url && !isChartUrlWithParams(tab.url)) {
				return false;
			}

			const url = new URL(tab.getURL());

			const searchParams = new URLSearchParams(url.search);

			if (!searchParams.has('rendererInitialData')) {
				return true;
			}

			return false;
		});
	}

	public getChartTabs(tabs: Tab[] = this.tabs): TvTab[] {
		return tabs
			.filter((tab) => tab.isBrowserViewValid())
			.filter((tab) => Boolean(tab.url && (isChartUrl(tab.url) || isChartUrlWithParams(tab.url))))
			.filter((tab): tab is TvTab => tab instanceof TvTab);
	}

	@logCall
	protected override async willCloseWindow(): Promise<boolean> {
		let hasConnection = false;
		try {
			hasConnection = await networkService().ping();
		}
		catch (error) {
			loggerService().error('TabbedWindowBase.willCloseWindow: NetworkService.ping error', error);
		}

		if (!hasConnection) {
			this.beforeCloseStateSnapshot = this.makeStateSnapshot();
			this.changedNotificationsEnabled = false;
			return true;
		}

		const chartTabs = this.getChartTabs();
		const user = userService().getCurrentUser();
		const autoSavePossible = user.isAuthenticated &&
			!this.hasChartUrlWithQueryParams() &&
			await canFollowAutoSaveFlow(chartTabs);

		/**
		 * the only beforeunload dispatch of this close attempt; stays empty when the dispatch fails,
		 * which skips the autosave branch and makes the ask path re-dispatch per tab
		 */
		let messages: Map<TvTab, string | undefined> = new Map();
		try {
			messages = await dispatchBeforeUnloadToChartTabs(chartTabs);
		}
		catch (error) {
			loggerService().error('TabbedWindowBase.willCloseWindow: dispatchBeforeUnload failed, falling back to asking the user', error);
		}

		if (autoSavePossible && messages.size > 0) {
			const isRecordingIdea = windowService().anyChartTabHasIdeaRecording(
				chartTabs,
				chartTabs.map((chartTab) => messages.get(chartTab)),
			);

			if (!isRecordingIdea) {
				this.chartTabsPendingSave = collectChartTabsPendingSave(chartTabs);

				// the unsaved state comes from the dispatch above, not from a second one
				if (this.chartTabsPendingSave.some((chartTab) => messages.get(chartTab) !== undefined)) {
					const result = await this.trySaveChartChanges(SaveChangesScopeType.Window);

					if (result === SaveChangesFlowResult.Cancelled) {
						this.beforeCloseStateSnapshot = null;
						return false;
					}

					// Saved or Discarded: the close proceeds
					this.beforeCloseStateSnapshot = this.makeStateSnapshot();
					/**
					 * the window is being torn down: stop it from emitting persistence-change
					 * notifications (debounced settings.json writes) that could capture a
					 * half-closed state, matching the no-connection and ask-user close paths
					 */
					this.changedNotificationsEnabled = false;
					this.tabs.forEach(tab => { tab.isCloseBlocked = true; });

					return true;
				}

				/**
				 * nothing to autosave: fall through to the ask path anyway. A clean deduped set
				 * does not prove the window is clean - a dedup-excluded duplicate of a layout or
				 * a non-chart tab can still hold unsaved state, and getCloseStatus() below is
				 * what polls every tab (reusing this attempt's messages for the chart tabs).
				 */
			}
		}

		// ask-user fallback (autosave not applicable, nothing to autosave, idea recording,
		// or the dispatch failed), reusing the messages of this attempt's dispatch
		let willClose = true;
		this.beforeCloseStateSnapshot = this.makeStateSnapshot();

		try {
			this.changedNotificationsEnabled = false;
			willClose = (await this.getCloseStatus(false, CheckUnsavedChangesMode.Ask, messages)).mayClose;
		}
		catch (error) {
			loggerService().error('TabbedWindowBase.willCloseWindow: getCloseStatus error', error);
			if (this.saveChangesDialog?.windowRef && !this.saveChangesDialog?.windowRef?.isDestroyed()) {
				windowService().saveChangesErrorSubject.next({ scopeId: this.persistentId, hasError: true });
			}
		}

		if (!willClose) {
			// eslint-disable-next-line no-return-assign
			this.beforeCloseStateSnapshot = null;
		}

		return willClose;
	}

	@logCall
	setActiveTab(tab: Tab, focusTab = true): void {
		this.tabs.forEach((t) => {
			t.active = false;
		});
		tab.active = true;

		this.updateWindowTitle();
		this.notifyTabsChanged();

		this.setWindowLoading(tab.isLoading);

		const currentView = this.windowRef.getBrowserView();

		if (currentView) {
			this.windowRef.removeBrowserView(currentView);
		}

		if (tab.isLoading || !tab.isBrowserViewValid()) {
			this.setWindowLoading(true);
			return;
		}

		this.setActiveTabView(focusTab);

		tab.executeJavaScript(`window.remoteServiceInstanceId = '${ this.remoteServiceInstanceId }';`)
			.catch((error) => {
				loggerService().error('TabbedWindowBase.setActiveTab(): tab.executeJavaScript', error);
			});
	}

	@logCall
	private setActiveTabView(focusView = true): void {
		const activeTab = this.activeTab;
		if (activeTab === null || !activeTab.isBrowserViewValid()) {
			loggerService().error('[TabbedWindowBase.setActiveTabView()] No active tab');

			const lastTab = this.tabs.at(-1);

			if (lastTab) {
				this.setActiveTab(lastTab);
			}

			return;
		}

		if (this.windowRef.isDestroyed()) {
			return;
		}

		const currentWebContent = this.windowRef.getBrowserView()?.webContents;
		if (currentWebContent && !currentWebContent.isDestroyed() && currentWebContent.id === activeTab.webContentsId()) {
			return;
		}

		activeTab.applyToWindow(this.windowRef);

		if (this.windowRef.isFocused() && focusView) {
			activeTab.focus();
		}

		const macosFullscreen = appSettingsService().get('macosHideTabsInFullscreen');
		const tabFullscreened = this.windowRef.isFullScreen() || activeTab.isFullscreened;
		const isFullscreened = isDarwin() ? macosFullscreen && tabFullscreened : tabFullscreened;

		activeTab.setBounds(this.computeViewBounds(isFullscreened));

		this.setWindowLoading(false);
	}

	private onTabStartedLoading(tab: Tab): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}

		if (!tab.url && !tab.errorState?.failedUrl) {
			return;
		}

		tab.applyBoundsFromWindow(this);

		const currentView = this.windowRef.getBrowserView();

		if (currentView && currentView.webContents?.id === tab.webContentsId()) {
			this.windowRef.removeBrowserView(currentView);
		}
	}

	private onTabFinishedLoading(tab: Tab): void {
		if (!tab.active) {
			return;
		}

		if (!tab.url && !tab.errorState?.failedUrl) {
			return;
		}

		tab.deapplyFromWindow();

		this.setActiveTabView();
	}

	private localizeURL(URL: string): string {
		return userProfileUrl.test(URL) ? URL : localeService().localeAwareUrl(URL);
	}

	@logCall
	private handleTabLoading(tab: Tab): void {
		const sub = tab.loadingChange.subscribe((isLoading: boolean) => {
			this.setWindowLoading(isLoading);

			isLoading ? this.onTabStartedLoading(tab) : this.onTabFinishedLoading(tab);
		});

		this.loadingTabs.set(tab.id, sub);
	}

	@logCall
	updateCurrentTabUrl(id: string, url: string): void {
		if (!this.notifyContainerTabsChanged || !this.appReady) {
			return;
		}

		if (this.tabsContainer) {
			this.tabsContainer.updateTabUrl(id, url)
				.catch((error) => {
					loggerService().error(
						`TabbedWindowBase(remoteServiceInstanceId: ${
							shortifyId(this.remoteServiceInstanceId)
						}).updateCurrentTabUrl(): tabsContainer.updateTabUrl() error`,
						error
					);
				});
		}
		else {
			loggerService().warn('TabbedWindowBase().updateCurrentTabUrl(): "Tabs container not found"');
		}
	}

	@logCall
	private updateTabsContainer(resetMousePosition?: boolean): void {
		if (!this.notifyContainerTabsChanged || !this.appReady) {
			return;
		}

		const tabViews: TabView[] = this.tabs.map(({ id, active, offset, pinned, url, width }) =>
			({
				id,
				active,
				pinned,
				offset,
				width,
				isChart: isChartUrl(url),
				visible: true,
			}));

		if (this.tabsContainer) {
			this.tabsContainer.updateTabs(tabViews, resetMousePosition)
				.catch((error) => {
					loggerService().error(
						`TabbedWindowBase(remoteServiceInstanceId: ${
							shortifyId(this.remoteServiceInstanceId)
						}).updateTabsContainer(): tabsContainer.updateTabs() error`,
						error
					);
				});
		}
		else {
			loggerService().warn('TabbedWindowBase().updateTabsContainer(): "Tabs container not found"');
		}
	}

	@logCall
	private notifyTabsChanged(resetMousePosition?: boolean): void {
		this.updateTabsContainer(resetMousePosition);
		this.notifyStateChanged();
	}

	triggerMenuCloseEvent(triggerSource: MenuCloseEventSource): void {
		this.menuCloseEventSubject.next(triggerSource);
	}

	public async getCloseStatus(canCloseAll = false, mode = CheckUnsavedChangesMode.Ask, beforeUnloadMessages?: ReadonlyMap<Tab, string | undefined>): Promise<WindowCloseStatus> {
		const wndClosingStatus = await this.tryCloseTabs(this.tabs, canCloseAll, mode, beforeUnloadMessages);

		return wndClosingStatus;
	}

	public async tryCloseTabs(tabs: Tab[], canCloseAll = false, mode = CheckUnsavedChangesMode.Ask, beforeUnloadMessages?: ReadonlyMap<Tab, string | undefined>): Promise<WindowCloseStatus> {
		const closeAllowed: WindowCloseStatus = {
			mayClose: true,
			closeToAll: false,
		};

		const closeNotAllowed: WindowCloseStatus = {
			mayClose: false,
			closeToAll: false,
		};

		for (const tab of tabs) {
			if (tab.isCloseBlocked) {
				loggerService().warn('[TabbedWindowBase.checkTabCanBeClosed()] Attempting to close tab that is already closing');
				return closeNotAllowed;
			}

			if (mode === CheckUnsavedChangesMode.Ask) {
				tab.isCloseBlocked = true;
			}

			let hasConnection;
			try {
				hasConnection = await networkService().ping();
			}
			catch (error) {
				loggerService().error('TabbedWindowBase.tryCloseTabs: NetworkService.ping error', error);
			}

			if (!hasConnection) {
				tab.isCloseBlocked = false;
				continue;
			}

			const message = beforeUnloadMessages?.has(tab) ? beforeUnloadMessages.get(tab) : await tab.dispatchBeforeUnloadEvent();
			if (message === undefined) {
				tab.isCloseBlocked = false;
				continue;
			}

			if (mode === CheckUnsavedChangesMode.CheckOnly) {
				closeNotAllowed.closeForbiddenTabId = tab.id;
				return closeNotAllowed;
			}

			this.setActiveTab(tab);

			const isChartTab = tab.url && (isChartUrl(tab.url) || isChartUrlWithParams(tab.url));
			const isRecordingIdea = message === CHART_RECORD_IDEA_WARNING_MESSAGE;

			if (!canCloseAll && tabs.length === 1 && isChartTab && !isRecordingIdea) {
				if (tab instanceof TvTab) {
					const user = userService().getCurrentUser();

					const closeTabAnswer = await askUserToCloseOrToReloadUnsavedChart(this.windowRef, tab, false, !user.isAnonymous && !!user.session, message);
					if (closeTabAnswer === CloseOrReloadUnsavedChart.SaveOrReload) {
						const saveResponse = await tab.saveChart(SaveChangesScopeType.Chart);
						// a failed save must not close the tab (the unsaved changes would be lost):
						// fall through to the answer check below, which keeps the tab open
						if (saveResponse !== null && saveResponse.success) {
							tab.isCloseBlocked = false;
							return closeAllowed;
						}
					}

					tab.isCloseBlocked = false;

					return closeTabAnswer === CloseOrReloadUnsavedChart.Close ? closeAllowed : closeNotAllowed;
				}
			}

			const closeTabsAnswer = await askUserToCloseUnsavedChartTab(this.windowRef, canCloseAll || tabs.length > 1, tab.url, message);

			tab.isCloseBlocked = false;
			if (closeTabsAnswer.closeToAll || !closeTabsAnswer.mayClose) {
				closeTabsAnswer.closeForbiddenTabId = tab.id;
				return closeTabsAnswer;
			}
		}

		return closeAllowed;
	}

	override getWindowState(): WindowState {
		const state = super.getWindowState();

		if (state === WindowState.Fullscreen && this.tabsPanelShow) {
			return WindowState.FullscreenWithPanel;
		}

		if (state !== WindowState.Fullscreen) {
			this.tabsPanelShow = false;
		}

		return state;
	}

	topAreaHover(isHovered: boolean): void {
		if (!this.windowRef.isFullScreen()) {
			return;
		}

		// Only show the top panel when the setting window is not shown
		if (isSettingsWindowShown()) {
			return;
		}

		if (this.panelDelayedTimeout) {
			clearTimeout(this.panelDelayedTimeout);
		}

		this.panelDelayedTimeout = global.setTimeout(() => {
			if (mainMenuService().getMenuOpened()) {
				return;
			}
			this.tabsPanelShow = isHovered;

			const activeTab = this.activeTab;
			if (activeTab !== null && activeTab.isBrowserViewValid()) {
				activeTab.setBounds(this.computeViewBounds(!isHovered));
			}

			this.changeWindowState();
		}, this.tabsPanelShowDelay);
	}

	@logCall
	setWindowLoading(loading: boolean): void {
		this.windowLoadingSubject.next(loading);
	}

	protected getTitleHeight(): number {
		// TODO: Rename/Refactor this method
		// it seem to be used to determine hover area at the top of the fullscreened app to trigger Title Bar show
		// but function name sounds like it determines actual height of the Title Bar
		const hiddenPanelHeight = 2;
		return this.tabsPanelShow ? TabbedWindowBase.defaultWindowHeaderHeight : hiddenPanelHeight;
	}

	@logCall
	private restoreWindowState(): void {
		if (this.options && this.options.windowOptions) {
			const wndOptions = this.options.windowOptions;
			const wndState = typeof wndOptions.state !== 'undefined' ? wndOptions.state : WindowState.Normal;
			this.stateBeforeFullscreen = this.options.windowOptions.stateBeforeFullscreen;

			if (isDarwin() && wndOptions.show === false) {
				this.show();
			}

			if (wndState === WindowState.Maximized) {
				this.maximize();
			}
			// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
			// eslint-disable-next-line no-mixed-operators
			else if (wndState === WindowState.Fullscreen || wndState === WindowState.FullscreenWithPanel && !this.windowRef.isFullScreen()) {
				this.windowRef.setFullScreen(true);
			}
			else if (wndState === WindowState.Minimized) {
				this.windowRef.minimize();
			}
			else if (this.windowRef.isMaximized()) {
				this.windowRef.unmaximize();
			}
			else if (this.windowRef.isMinimized()) {
				this.windowRef.restore();
			}
		}
	}

	private getCurrentTabIndex(): number {
		const tabs = this.tabs;
		if (!tabs) {
			return -1;
		}

		return tabs.length === 1 ? 0 : tabs.findIndex(t => t.active);
	}

	protected getCurrentTab(): Tab | undefined {
		const index = this.getCurrentTabIndex();
		return index === -1 ? undefined : this.tabs?.[index];
	}

	public getIsTabPinned(tabId: TabId): boolean {
		return this.tabs.some(({ id, pinned }) => pinned && id === tabId);
	}

	protected setNextTab(offset: number): void {
		const currentTabIndex = this.getCurrentTabIndex();
		if (currentTabIndex === -1) {
			return;
		}

		let nextTabIndex = currentTabIndex + offset;
		if (nextTabIndex < 0) {
			nextTabIndex = this.tabs.length - 1;
		}
		else if (nextTabIndex >= this.tabs.length) {
			nextTabIndex = 0;
		}

		const nextTab = this.tabs[nextTabIndex];

		this.changeTab(nextTab.id);
	}

	isInProcessOfDispose(): boolean {
		return this.isClosing || this.isClosed || this.isDisposed;
	}

	acceptInput(ev: Event, input: Input): void {
		let dragServiceInstance: Promisify<IDragService>;

		try {
			dragServiceInstance = dragServiceProxy();
		}
		catch (error) {
			if (input?.type) {
				loggerService().error(`[TabbedWindowBase().acceptInput()] - dragService(): input.type = ${ input.type } input.key = ${ input.key }`);
			}
			loggerService().error('[TabbedWindowBase().acceptInput()] - dragService() error', error);
			return;
		}

		if (this.isInProcessOfDispose()) {
			return;
		}

		dragServiceInstance.getIsInDrag()
			.then(isInDrag => {
				if (isInDrag || AuthenticationHandler.isAppOnboardingWindowLoading) {
					return;
				}
				this.inputProcessor.injectInput(ev, input);
			})
			.catch(error => {
				loggerService().error('[TabbedWindowBase().acceptInput()] - dragService().getIsInDrag() error', error);
			});
	}

	/**
	 * Crutch for Windows with ru keyboard
	 */
	@logCall
	private notifyInputEventFilterForRuLang(ev: KeyboardEventData, browserLang?: string[]): string {
		const hasRuLangInSystem = browserLang && browserLang.length > 0 && (browserLang[0] === 'ru' || browserLang[1] === 'ru');

		if (!hasRuLangInSystem) {
			return ev.key;
		}

		const isChart = windowService().getLastFocusedWindow()?.tabs.find(tab => tab.active && tab.url && isChartUrl(tab.url));

		if (!isChart) {
			return ev.key;
		}

		// https://www.unicode.org/charts/nameslist/n_0400.html#044E
		const SMALL_U_CHAR = '\u044e';
		if (ev.key === SMALL_U_CHAR) {
			return '.';
		}

		if (ev.code === 'Slash') {
			return '/';
		}

		return ev.key;
	}

	@logCall
	public notifyInputEvent(type: string, ev: KeyboardEventData, browserLang?: string[]): void {
		const tab = this.activeTab;
		if (tab === null || !tab.isBrowserViewValid() || ev.key === 'F11') {
			return;
		}

		tab.focus();

		const inputEvent: Electron.KeyboardInputEvent = {
			type: this.notifyInputEventTypes[type],
			keyCode: this.notifyInputEventFilterForRuLang(ev, browserLang),
		};

		if (ev.ctrlKey) {
			inputEvent.modifiers = ['ctrl'];
		}
		if (ev.shiftKey) {
			inputEvent.modifiers = ['shift'];
		}
		if (ev.altKey) {
			inputEvent.modifiers = ['alt'];
		}
		if (ev.metaKey) {
			inputEvent.modifiers = ['meta'];
		}

		tab.sendInputEvent(inputEvent);
	}

	get isWindowWasClosedAfterTabDetach(): boolean {
		return this.isWindowWasClosedAfterDetachOfTab;
	}

	set isWindowWasClosedAfterTabDetach(value: boolean) {
		if (typeof value !== 'boolean') {
			throw new Error('Incorrect value for isWindowWasAttached');
		}

		this.isWindowWasClosedAfterDetachOfTab = value;
	}

	/**
	 * Drives the saving dialog over this.chartTabsPendingSave through the shared orchestrator
	 * (show dialog -> save -> on failure await the user's decision -> retry / discard / cancel).
	 */
	private async trySaveChartChanges(scopeType: SaveChangesScopeType): Promise<SaveChangesFlowResult> {
		/**
		 * scope the dialog signals to this window so a concurrent flow in another window (its own
		 * close or group switch-off) can't flip this dialog's error state or consume its decision
		 */
		const scope: SaveChangesScope = { type: scopeType, id: this.persistentId };

		/**
		 * decisions are only ever emitted by the dialog's renderer, so if the dialog dies without one
		 * (window destroyed by another teardown path, renderer crash) the decision await below would
		 * hang forever; created lazily because the dialog only exists once showDialog has run
		 */
		let dialogGone: Promise<null> | null = null;
		const awaitDialogGone = (): Promise<null> => {
			dialogGone ??= new Promise((resolve) => {
				const dialog = this.saveChangesDialog;
				if (dialog === null || dialog.windowRef.isDestroyed()) {
					resolve(null);
					return;
				}

				dialog.windowRef.once('closed', () => resolve(null));
				dialog.windowRef.webContents.once('render-process-gone', () => resolve(null));
			});

			return dialogGone;
		};

		return runSaveChangesFlow({
			chartTabs: this.chartTabsPendingSave,
			scopeType,
			showDialog: () => this.showSaveChangesDialog(scope),
			/**
			 * the window stays alive on a group switch-off (and on a cancelled close), so the transient
			 * saving dialog must always be torn down; the orchestrator does this in its finally block
			 */
			closeDialog: () => this.disposeSaveChangesDialog(),
			setError: (hasError) => windowService().saveChangesErrorSubject.next({ scopeId: scope.id, hasError }),
			awaitSaveChangesDecision: async() => {
				const decision = await Promise.race([
					awaitSaveChangesDecisionOnce(windowService().saveChangesDecisionSubject, scope.id),
					awaitDialogGone(),
				]);

				if (decision === null) {
					loggerService().warn('TabbedWindowBase.runSaveChangesDialogFlow: the save-changes dialog is gone without a decision, cancelling the flow');
					return SaveChangesDecisionType.Cancel;
				}

				return decision;
			},
		});
	}

	/**
	 * Unsaved-changes confirmation for switching off (deactivating) a tab group, structured as:
	 * internal-state queries with early stops first (no page events), then a single beforeunload
	 * dispatch per close attempt, then the decision - autosave behind the saving dialog or ask
	 * the user - derived entirely from the messages of that one dispatch.
	 * Returns true when the group switch-off may proceed.
	 */
	private async confirmGroupShutdown(tabs: Tab[]): Promise<boolean> {
		let hasConnection;
		try {
			hasConnection = await networkService().ping();
		}
		catch (error) {
			loggerService().error('TabbedWindowBase.confirmGroupShutdown: NetworkIndicationService.ping error', error);
		}

		if (!hasConnection) {
			return true;
		}

		const chartTabs = this.getChartTabs(tabs);
		if (chartTabs.length === 0) {
			return true;
		}

		const autoSavePossible = !this.hasChartUrlWithQueryParams(tabs) && await canFollowAutoSaveFlow(chartTabs);

		let messages: ReadonlyMap<TvTab, string | undefined>;
		try {
			messages = await dispatchBeforeUnloadToChartTabs(chartTabs);
		}
		catch (error) {
			// unknown unsaved state: never tear the group down silently, let the user decide
			loggerService().error('TabbedWindowBase.confirmGroupShutdown: dispatchBeforeUnload failed, asking the user', error);
			return askUserToCloseGroup(this.windowRef);
		}

		if (![...messages.values()].some((message) => message !== undefined)) {
			return true;
		}

		const isRecordingIdea = windowService().anyChartTabHasIdeaRecording(
			chartTabs,
			chartTabs.map((chartTab) => messages.get(chartTab)),
		);

		if (autoSavePossible && !isRecordingIdea) {
			this.chartTabsPendingSave = collectChartTabsPendingSave(chartTabs);

			if (this.chartTabsPendingSave.some((chartTab) => messages.get(chartTab) !== undefined)) {
				const result = await this.trySaveChartChanges(SaveChangesScopeType.Group);

				// Saved/Discarded proceed; Cancelled (user abort or flow failure) keeps the group active
				return result !== SaveChangesFlowResult.Cancelled;
			}

			/**
			 * some chart tab is dirty (checked above) but the deduped set is clean: only
			 * dedup-excluded duplicates hold the changes, and saving cannot preserve them
			 * (their layout slot is taken by the clean representative), so ask instead
			 */
		}

		return askUserToCloseGroup(this.windowRef);
	}

	/**
	 * Tries to switch off (deactivate) the group currently shown in this window: confirms unsaved
	 * changes the same way as on app/window closing, then destroys the group tabs BrowserViews
	 * keeping the tabs registered in TabManager so the group can be activated again later.
	 * Returns false when the user cancelled the switch-off or saving failed.
	 */
	@logCall
	private async trySwitchOffActiveGroup(): Promise<boolean> {
		const groupId = this.effectiveGroupId;

		if (!await this.confirmGroupShutdown([...this.tabs])) {
			return false;
		}

		/**
		 * read this.tabs fresh after the confirmation: it can await user dialogs, during which
		 * the group's tab list may change (e.g. a tab moved in from another window); the cleanup
		 * must cover the tabs as they are now, not as they were when the user was asked
		 */
		for (const tab of this.tabs) {
			this.loadingTabs.get(tab.id)?.unsubscribe();
			this.loadingTabs.delete(tab.id);
		}

		await tabManager().deactivateGroup(groupId);

		// the tabs stay registered and must remain closable after the group is activated again
		for (const tab of this.tabs) {
			tab.isCloseBlocked = false;
		}

		return true;
	}
}

UndoStack.registerUndoHandler('tab-closed', {
	undo(command: string, data: TabClosedUndoData): void {
		loggerService().debug('TabbedWindow:Undo:RestoreTab');

		const wnd = windowService().findWindow({ windowPersistentId: data.windowPid });
		if (!wnd || wnd.windowRef.isDestroyed()) {
			return;
		}

		wnd.createAndAddTab({
			id: data.persistentId,
			url: formatLink(data.url),
			title: data.title,
			pinned: data.pinned,
			symbol: data.symbol,
			watchlist: data.watchlist,
			position: data.position,
			waitUntilLoad: true,
			active: data.active,
		})
			.then((id) => {
				if (data.linkGroupName === undefined) {
					return;
				}

				linkingService().assignGroup(id, data.linkGroupName);
			})
			.catch((error) => { loggerService().error('UndoStack.registerUndoHandler() error in wnd.addTab()', error); });

		wnd.windowRef.focus();
	},

	undoItemDescription(): string {
		return i18n.t('Reopen closed tab');
	},
});
