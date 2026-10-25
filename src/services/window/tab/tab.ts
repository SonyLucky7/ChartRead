import { app, BrowserView, BrowserWindow, Event, RenderProcessGoneDetails } from 'electron';
import * as path from 'path';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

import { HttpResponseCode } from '../../../http';
import { Promisify } from '../../../ipc-remote';
import { loggerService } from '../../../logger';
import { shortifyId, shortifyUrl } from '../../../logger/log-formatter';
import { formatLink, resolveEmbeddedLink } from '../../../navigation/navigation-rules';
import { TabNavigationHandler } from '../../../navigation/tab-navigation-handler';
import { scheduledCall, Scheduler, SchedulerMode, SchedulerProvider, schedulingService } from '../../../scheduling';
import { Disposable } from '../../../tvd-runtime/core';
import { IPersistentObjectImplementation } from '../../../tvd-runtime/core/persistence/persistence-core';
import {
	ERROR_VIEW_PATH,
	ignorePromise,
	isChartUrl,
	isLocalURI,
	isPineEditorUrl,
	makeFileURI,
	sleep,
} from '../../../utils';
import { dispatchBeforeUnload, isDarwin } from '../../../utils/helpers';
import { contextMenuService } from '../../context-menu';
import { BLANK_TAB_URL, CHART_RECORD_IDEA_WARNING_MESSAGE, InputAcceptor } from '../../interfaces';
import { localeService } from '../../locale';
import { dragServiceProxy } from '../../native-drag-service';
import { isDragServiceReady } from '../../native-drag-service/native-drag-configuration';
import { themeManager } from '../../settings/theme';
import { userService } from '../../user';
import { windowService } from '../.';
import { TabbedWindowBase } from '../tabbed-window';
import { TabbedWindow } from '../tabbed-window-imports';
import { ITabController, RendererServiceData, SymbolData, TabTitle, TabTitleView, TabTitleViewType, TabView } from '../window-api';
import { makeBrowserViewOptions } from '../window-options';
import { BrowserViewFacade } from './browser-view-facade';
import { TabError, TabErrorState } from './tab-error-state';
import { getTabFaviconKeyFromUrl } from './tab-title-api';
import { checkShouldBeSaved } from './tv-api-scripts';

export interface TabState {
	persistentId: string;
	url: string;
	title: TabTitle;
	active: boolean;
	fullscreen: boolean;
	pinned: boolean;
	symbol?: SymbolData;
	watchlist?: string;
}

interface OptionsIgnoreHotkeyCollections {
	control?: boolean;
}

const crashReasons: RenderProcessGoneDetails['reason'][] = ['crashed', 'oom'];

const enum NetErrorList {
	ABORTED = -3,
}

export abstract class Tab extends BrowserViewFacade implements TabView, SchedulerProvider, IPersistentObjectImplementation, Disposable {
	private static readonly titleChangeSubject = new Subject<Tab>();
	public static readonly titleChange = Tab.titleChangeSubject.asObservable();

	private readonly persistentId: string;
	remoteServiceInstanceId?: string;

	#title: TabTitle = '';

	pinned = false;

	hasIdeaRecord = false;
	hasFocusOnPineEditor = false;

	private loadingUrl?: string;

	private ignoreCollection = new Map<string, OptionsIgnoreHotkeyCollections>([
		['keyu', { control: true }],
		['keyk', { control: true }],
		['comma', { control: true }],
		['f1', {}],
	]);

	isFullscreened = false;

	// TODO: make offset and width fields private, make it number | null, add getters/setters, adapt to be used in moveTab function
	offset: number | undefined;
	width: number | undefined;

	isCloseBlocked = false;

	private loadingSubject = new BehaviorSubject<boolean>(false);
	readonly loadingChange = this.loadingSubject.asObservable();

	protected controller: Promisify<ITabController> | undefined;
	protected isDisposed = false;

	private afterBrowserViewCreationTasks: (() => void)[] = [];

	private navigationHandler?: TabNavigationHandler;

	private loadAwaiter: Promise<boolean>;
	errorState?: TabErrorState;

	private readonly scheduler: Scheduler;
	private defaultScheduleMode?: SchedulerMode;

	private tokyoNightSubscription?: Subscription;

	readonly codeTurnOnTokyoNight = `(() => {
		const tvMainContainer = document.querySelector(".tv-main");
		if (tvMainContainer && !tvMainContainer.classList?.contains("tokyo-night")) {
			tvMainContainer.classList.add("tokyo-night");
			return;
		}
		if (!document.querySelector(".chart-page")?.classList?.contains("tokyo-night")) {
			document.querySelector(".chart-page")?.classList?.add("tokyo-night");
		}
		document.querySelector("body")?.classList?.add("tokyo-night")
	})();
	`;

	private static tabPriority(tab: Tab): number {
		const INVISIBLE_WND_PRIORITY = 0;
		const NORMAL_WND_PRIORITY = 10;
		const FOCUSED_WND_PRIORITY = 20;

		const ACTIVE_TAB_PRIORITY = 5;

		let result = INVISIBLE_WND_PRIORITY;

		try {
			if (tab.isBrowserViewValid()) {
				const wnd = windowService().findWindow({ tabWebContents: tab.browserView.webContents });
				if (wnd && wnd.windowRef && !wnd.windowRef.isDestroyed()) {
					if (wnd.windowRef.isMinimized()) {
						return INVISIBLE_WND_PRIORITY;
					}
					result = wnd.windowRef.isFocused() ? FOCUSED_WND_PRIORITY : NORMAL_WND_PRIORITY;
				}
			}
			else {
				result = NORMAL_WND_PRIORITY;
			}
		}
		catch (err) {
			loggerService().error(`Error at assigning priority for ${ tab.id }`, err);
			result = NORMAL_WND_PRIORITY;
		}

		return result + (tab.active ? ACTIVE_TAB_PRIORITY : 0);
	}

	private static errorViewUrl(): string {
		return makeFileURI(path.join(app.getAppPath(), 'app/error-view', 'index.html'));
	}

	private static buildTitleView(title: TabTitle, url: string): TabTitleView {
		if (typeof title !== 'string') {
			return { ...title, type: TabTitleViewType.ChartData };
		}

		return { title, type: TabTitleViewType.Basic, faviconKey: getTabFaviconKeyFromUrl(url) };
	}

	static isUlsFromSameDomains(first: string, second: string): boolean {
		const firstIsLocalFile = !!first && isLocalURI(first);
		const secondIsLocalFile = !!second && isLocalURI(second);
		return firstIsLocalFile === secondIsLocalFile;
	}

	constructor(id: string) {
		super();
		this.persistentId = id;

		this.scheduler = schedulingService().defaultTaskQueue.createScheduler(Tab.tabPriority, this);

		this.loadAwaiter = new Promise((resolve) => {
			this.loadResolver = resolve;
		});
	}

	public get id(): string {
		return this.persistentId;
	}

	public get url(): string {
		if (this.loadingUrl) {
			return this.loadingUrl;
		}

		// TODO: reconsider returning null value instead of an empty string value
		// when the browser view is not valid: TVD-2487
		return this.isBrowserViewValid() ? this.browserView.webContents.getURL() : '';
	}

	private loadResolver: (value: boolean | PromiseLike<boolean>) => void = () => { };

	get active(): boolean {
		// TODO: why is it used as optional in TVD-2873
		const mode = this.scheduler?.mode ?? this.defaultScheduleMode;
		return mode === SchedulerMode.Foreground;
	}

	set active(value: boolean) {
		if (!this.scheduler) {
			return;
		}

		this.scheduler.mode = value ? SchedulerMode.Foreground : SchedulerMode.Background;
	}

	public get title(): TabTitle {
		return this.#title;
	}

	public set title(newTitle: TabTitle) {
		this.#title = newTitle;

		Tab.titleChangeSubject.next(this);

		this.controller?.setTitle(Tab.buildTitleView(this.#title, this.url))
			.catch((error) => {
				loggerService().error('Tab.title(): this.controller.setTitle() error', error);
			});
	}

	get pid(): number | null {
		return this.browserViewMember?.webContents.getOSProcessId() ?? null;
	}

	get state(): TabState {
		return this.makeStateSnapshot();
	}

	getScheduler(): Scheduler {
		return this.scheduler;
	}

	async getVisibleStatus(): Promise<string> {
		try {
			const result = await Promise.race([
					this.browserViewMember?.webContents.executeJavaScript('document.visibilityState') as Promise<string>,
					new Promise<string>(resolve => setTimeout(() => resolve('loading'), 100)),
			]);
			return result;
		}
		catch {
			return 'loading';
		}
	}

	async freeze(): Promise<void> {
		loggerService().warn(`Tab.freeze() id ${ this.id }`);
		try {
			if (!this.browserViewMember?.webContents.debugger.isAttached()) {
				this.browserViewMember?.webContents.debugger.attach('1.3');
			}

			await this.browserViewMember?.webContents.debugger.sendCommand('Page.setWebLifecycleState', { state: 'frozen' });
		}
		catch (error) {
			loggerService().error('Tab.freeze(): debugger.sendCommand() failure', error);
		}
	}

	get isLoading(): boolean {
		return this.loadingSubject.getValue();
	}

	private ignoreHotkey({ code, control, meta }: Electron.Input): boolean {
		if (!this.isBrowserViewValid()) {
			return true;
		}

		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line no-mixed-operators
		const isIgnored = this.url && (isPineEditorUrl(this.url) && this.isFocused() || isChartUrl(this.url) && this.hasFocusOnPineEditor);
		if (!isIgnored) {
			return false;
		}

		const currentHotkey = this.ignoreCollection.get(code.toLowerCase());
		if (!currentHotkey) {
			return false;
		}

		const hasPressCtrl = isDarwin() ? meta || control : control;
		if (currentHotkey.control && !hasPressCtrl) {
			return false;
		}

		return true;
	}

	private onRendererProcessGone(reason: RenderProcessGoneDetails['reason']): void {
		if (!crashReasons.includes(reason)) {
			return;
		}

		ignorePromise(this.loadErrorView(this.url, { type: 'crash', crashReason: reason }));
	}

	protected makeStateSnapshot(): TabState {
		const url = this.errorState?.failedUrl ?? this.url;

		const tabState: TabState = {
			persistentId: this.persistentId,
			active: this.active,
			pinned: this.pinned,
			title: '',
			url: url !== '' ? formatLink(url) : '',
			fullscreen: this.isFullscreened,
		};

		if (this.errorState?.failedUrl) {
			tabState.title = this.errorState.title;
			return tabState;
		}

		if (typeof this.title === 'string') {
			tabState.title = this.title;
			return tabState;
		}

		tabState.title = this.title.symbol ?? '';
		return tabState;
	}

	public internalExtractState(): unknown {
		return this.makeStateSnapshot();
	}

	public internalApplyState(state: TabState): void {
		if (state.persistentId !== this.id) {
			throw Error('Id from state not equal to existing tab id. Make sure that tab created by one state');
		}

		this.recreateBrowserViewIfNeed(state.url);

		this.applyStateFields(state);
	}

	protected applyStateFields(state: TabState): void {
		this.loadingUrl = state.url;
		this.#title = state.title;

		this.active = state.active;
		this.isFullscreened = state.fullscreen;
		this.pinned = state.pinned;

		this.defaultScheduleMode = state.active ? SchedulerMode.Foreground : SchedulerMode.Background;
	}

	recreateTabContextMenu(): void {
		if (!this.isBrowserViewValid()) {
			return;
		}

		this.browserView.webContents.removeAllListeners('context-menu');
		contextMenuService().createContextMenu(this, this.browserView);
	}

	protected getHostWindow(): TabbedWindow | undefined {
		if (!this.isBrowserViewValid()) {
			return;
		}

		const hostWnd = windowService().findWindow({ tabWebContents: this.browserView.webContents });
		if (!hostWnd) {
			return;
		}

		return hostWnd;
	}

	protected getWindowRef(): BrowserWindow | undefined {
		return this.getHostWindow()?.windowRef;
	}

	private checkIsAutoSaveEnabled(): boolean {
		if (!window.TradingViewApi) {
			return false;
		}

		return window.TradingViewApi.getSaveChartService().autoSaveEnabled().value();
	}

	async isAutoSaveEnabled(): Promise<boolean> {
		if (!this.isBrowserViewValid()) {
			return false;
		}

		const code = `(function ${ this.checkIsAutoSaveEnabled.toString() })()`;
		try {
			const checkAutoSaveTimeout = 250;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const autoSave = await Promise.race([this.executeJavaScript(code), sleep(checkAutoSaveTimeout).then(() => false)]);
			return Boolean(autoSave);
		}
		catch (error: unknown) {
			if (error instanceof Error) {
				loggerService().error(`Tab.isAutoSaveEnabled(): (${ this?.url ?? '' }) ${ error.message }`);
			}
		}

		return false;
	}

	async checkCanBeUnloaded(): Promise<boolean> {
		return !!await this.dispatchBeforeUnloadEvent();
	}

	/**
	 *
	 * @returns message when unload prevented or undefined if tab can be unloaded
	 */
	async dispatchBeforeUnloadEvent(): Promise<string | undefined> {
		if (!this.isBrowserViewValid() || !this.getURL()) {
			return;
		}

		const dispatchTimeout = 250;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const result = await Promise.race([
			this.executeJavaScript(`(${ dispatchBeforeUnload.toString() })();`),
			sleep(dispatchTimeout),
		]);

		if (typeof result !== 'string') {
			return undefined;
		}

		const checkShouldBeSavedJsInject = `(${ checkShouldBeSaved.toString() })()`;

		try {
			const shouldSaveTimeout = 250;
			const shouldSave = await Promise.race([
				this.executeJavaScript<boolean>(checkShouldBeSavedJsInject),
				sleep(shouldSaveTimeout).then(() => true),
			]);

			if (shouldSave === false && result !== CHART_RECORD_IDEA_WARNING_MESSAGE) {
				return undefined;
			}
		}
		catch (error: unknown) {
			if (error instanceof Error) {
				loggerService().error(`Tab.checkShouldBeSaved(): (${ this?.url ?? '' }) ${ error.message }`);
			}
		}

		return result;
	}

	setController(controller: Promisify<ITabController>): void {
		if (this.isDisposed) {
			return;
		}

		this.controller = controller;
		this.onControllerReady();
	}

	protected onControllerReady(): void {
		if (!this.controller) {
			throw Error('Controller must be defined here');
		}

		this.controller.setTitle(Tab.buildTitleView(this.#title, this.url))
			.catch((error) => {
				loggerService().error('Tab.onControllerReady(): this.controller.setTitle() error', error);
			});
	}

	resetController(): void {
		this.controller = undefined;
	}

	private recreateBrowserViewIfNeed(url: string): void {
		// eslint-disable-next-line @typescript-eslint/no-extra-parens
		const needRecreate = !this.isBrowserViewValid() || !Tab.isUlsFromSameDomains(url, this.url) || this.errorState;

		if (needRecreate) {
			this.createTabBrowserView(isLocalURI(url));
		}
	}

	private createTabBrowserView(forLocalFile: boolean): void {
		this.dropTabBrowserView();

		this.browserView = new BrowserView(makeBrowserViewOptions(forLocalFile));
		this.navigationHandler = new TabNavigationHandler(this.browserView.webContents, this);

		this.setupViewEvents();
		this.setupLoadEvents();

		this.onTabBrowserViewCreated();
	}

	private dropTabBrowserView(): void {
		this.onBeforeBrowserViewDrop();

		if (this.isBrowserViewValid()) {
			// due to electron bug we shoulds explicitly remove browserView from window because sometimes, destoyed view causes crashed inside window
			this.deapplyFromWindow();

			this.clearSubscriptions();
			this.navigationHandler = undefined;
			this.browserView.webContents.close({ waitForBeforeUnload: true });
			this.resetBrowserView();
		}
	}

	protected onTabBrowserViewCreated(): void {
		this.notifyLoadStarted();
		this.afterBrowserViewCreationTasks.forEach(task => task());
		this.afterBrowserViewCreationTasks = [];
	}

	protected onBeforeBrowserViewDrop(): void {
		this.afterBrowserViewCreationTasks = [];
	}

	onceOnBrowserViewCreated(task: () => void): void {
		if (this.isBrowserViewValid()) {
			return task();
		}

		this.afterBrowserViewCreationTasks.push(task);
	}

	private setupViewEvents(): void {
		if (!this.isBrowserViewValid()) {
			throw Error('Setting up events for destroyed web content');
		}

		this.browserView.webContents
			.on('before-input-event', (ev: Event, input: Electron.Input) => {
				if (this.ignoreHotkey(input) || this.isDisposed) {
					return;
				}

				(this.getHostWindow() as InputAcceptor)?.acceptInput(ev, input);
			})
			.on('will-redirect', (ev: Event, targetUrl: string) => {
				loggerService().debug(`Tab id: ${ shortifyId(this.id) } will-redirect: ${ shortifyUrl(targetUrl) }`);
			})
			.on('did-navigate', (ev: Event, targetUrl: string) => {
				if (targetUrl === BLANK_TAB_URL) {
					return;
				}

				if (
					this.url &&
					this.url !== targetUrl &&
					!isLocalURI(this.url) &&
					!isChartUrl(targetUrl)
				) {
					const tabbedWindow = this.getHostWindow();
					if (tabbedWindow && !tabbedWindow.disposed() && this.url) {
						tabbedWindow.updateCurrentTabUrl(this.id, this.url);
					}
				}
			})
			.on('dom-ready', () => {
				if (windowService().getTokyoNightStatus()) {
					ignorePromise(this.executeJavaScript(this.codeTurnOnTokyoNight));
				}

				this.recreateTabContextMenu();
			})
			.on('render-process-gone', (event: Event, details: RenderProcessGoneDetails) => {
				this.onRendererProcessGone(details.reason);
			});

		this.tokyoNightSubscription = windowService().tokyoNightSubject.subscribe(hasTokyoNight => {
			if (this.isBrowserViewValid()) {
				const code = hasTokyoNight
					? this.codeTurnOnTokyoNight
					: 'document.querySelector(".chart-page")?.classList?.remove("tokyo-night");document.querySelector(".tv-main")?.classList?.remove("tokyo-night");';
				ignorePromise(this.executeJavaScript(code));
			}
		});
	}

	private setupLoadEvents(): void {
		if (!this.isBrowserViewValid()) {
			throw Error('Setting up load events for destroyed web content');
		}

		this.browserView.webContents
			.on('did-stop-loading', () => {
				this.notifyLoadFinished();
			})
			.on('did-finish-load', () => {
				this.notifyLoadFinished();
			})
			.on('did-fail-load', (ev, code, desc, validatedUrl, isMainFrame) => {
				this.notifyLoadFinished();

				const failedUrl = isMainFrame ? validatedUrl : this.browserView.webContents.mainFrame.url;

				if (!failedUrl || failedUrl.includes(ERROR_VIEW_PATH) || failedUrl.startsWith(BLANK_TAB_URL)) {
					return;
				}

				if (code === NetErrorList.ABORTED) {
					return;
				}

				loggerService().error(`Tab id: ${ shortifyId(this.id) } failed to load: ${ desc }`);
				this.loadErrorView(failedUrl, { type: 'load-failed', loadFailMessage: desc })
					.catch((error) => loggerService().error(`Tab id: ${ shortifyId(this.id) } loadErrorView error`, error));
			})
			.on('did-navigate', (ev: Event, targetUrl: string, responseCode: number) => {
				if (responseCode === HttpResponseCode.NotFound) {
					this.loadErrorView(targetUrl, { type: 'page-not-found' })
						.catch((error) => loggerService().error(`Tab id: ${ shortifyId(this.id) } loadErrorView error`, error));
				}
			});
	}

	private clearSubscriptions(): void {
		this.tokyoNightSubscription?.unsubscribe();
		this.tokyoNightSubscription = undefined;
	}

	@scheduledCall
	private async loadUrl(url: string): Promise<void> {
		loggerService().debug(`Tab id: ${ shortifyId(this.id) }, loading url: ${ shortifyUrl(url) }`);
		this.loadingUrl = url;
		try {
			await this.browserView.webContents.loadURL(url);
		}
		catch (error: unknown) {
			type WithErrNo = { errno?: number; };
			const errno = (error as WithErrNo)?.errno;
			const ERROR_PREVENT_UNLOAD = -2;

			if (errno === ERROR_PREVENT_UNLOAD) {
				return;
			}

			loggerService().error(`Tab id: ${ shortifyId(this.id) } load ${ shortifyUrl(url) } failure`, error);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async beforeLoad(targetUrl: string): Promise<void> {}

	public async load(url: string, windowRemoteServiceInstanceId?: string): Promise<void> {
		let targetUrl = url;

		const resolved = resolveEmbeddedLink(targetUrl);
		if (resolved !== undefined) {
			targetUrl = resolved.path;
		}

		this.recreateBrowserViewIfNeed(targetUrl);
		if (this.errorState !== undefined) {
			this.errorState = undefined;
		}

		await this.beforeLoad(targetUrl);

		if (isLocalURI(targetUrl)) {
			const currentUser = userService().getCurrentUser();
			const windowData = { userId: currentUser.id, tabId: this.id };
			if (windowRemoteServiceInstanceId !== undefined) {
				(windowData as RendererServiceData).remoteServiceInstanceId = windowRemoteServiceInstanceId;
			}
			const localUrl = new URL(targetUrl);
			localUrl.searchParams.set('rendererInitialData', JSON.stringify(windowData));

			return this.loadUrl(localUrl.toString());
		}

		return this.loadUrl(targetUrl);
	}

	private loadErrorView(failedUrl: string, tabError: TabError): Promise<void> {
		this.errorState = {
			failedUrl,
			title: this.title,
		};
		this.createTabBrowserView(true);

		const errorUrl = new URL(Tab.errorViewUrl());
		errorUrl.searchParams.set('rendererInitialData', JSON.stringify(tabError));

		return this.loadUrl(errorUrl.toString());
	}

	override async reload(): Promise<void> {
		if (this.isLoading) {
			return;
		}

		if (this.errorState) {
			return this.load(this.errorState.failedUrl);
		}

		const checkCanBeUnloaded = await this.checkCanBeUnloaded();

		if (!checkCanBeUnloaded) {
			return;
		}

		if (!this.isBrowserViewValid()) {
			return;
		}

		this.notifyLoadStarted();

		super.reload();
	}

	private notifyLoadStarted(): void {
		if (this.isLoading) {
			return;
		}

		this.loadAwaiter = new Promise((resolve) => {
			this.loadResolver = resolve;
		});

		this.loadingSubject.next(true);
	}

	private notifyLoadFinished(): void {
		if (!this.isLoading) {
			return;
		}

		this.loadResolver(true);

		this.loadingUrl = undefined;
		this.loadingSubject.next(false);
	}

	restoreIfFailed(): void {
		if (!this.errorState) {
			return;
		}

		ignorePromise(this.reload());
	}

	async reloadWithLocaleAwareness(): Promise<void> {
		if (this.errorState) {
			this.restoreIfFailed();
			return;
		}

		if (!this.url) {
			return;
		}

		const embeddedLink = resolveEmbeddedLink(this.url);

		if (embeddedLink) {
			await this.load(embeddedLink.path);
			return;
		}

		const localeAwareUrl = localeService().localeAwareUrl(this.url);

		if (this.url !== localeAwareUrl) {
			await this.load(localeAwareUrl);
		}
	}

	get canGoBack(): boolean {
		if (!this.isBrowserViewValid()) {
			return false;
		}

		return this.browserView.webContents.canGoBack();
	}

	get canGoForward(): boolean {
		if (!this.isBrowserViewValid()) {
			return false;
		}

		return this.browserView.webContents.canGoForward();
	}

	async goBack(): Promise<void> {
		if (!await this.checkCanBeUnloaded()) {
			return;
		}

		if (!this.isBrowserViewValid()) {
			return;
		}

		this.browserView.webContents.goBack();
	}

	async goForward(): Promise<void> {
		if (!await this.checkCanBeUnloaded()) {
			return;
		}

		if (!this.isBrowserViewValid()) {
			return;
		}

		this.browserView.webContents.goForward();
	}

	applyTheme(): void {
		themeManager().applyTheme(this.browserView.webContents);
	}

	applyToWindow(window: BrowserWindow): void {
		window.setBrowserView(this.browserView);
	}

	applyBoundsFromWindow(window: TabbedWindowBase): void {
		window.windowRef.addBrowserView(this.browserView);
		this.setBounds(window.computeViewBounds(false));
		window.windowRef.removeBrowserView(this.browserView);
	}

	deapplyFromWindow(): void {
		if (this.getHostWindow()?.windowRef.getBrowserView() === this.browserView) {
			this.getHostWindow()?.windowRef.removeBrowserView(this.browserView);
		}
	}

	/**
	 * Destroys the BrowserView to free resources but keeps the tab instance reusable:
	 * the tab stays registered in TabManager and its state remains extractable, so the
	 * BrowserView can be recreated later via internalApplyState()/load().
	 */
	public async deactivate(): Promise<void> {
		if (this.isDisposed || !this.isBrowserViewValid()) {
			return;
		}

		loggerService().debug(`Tab.deactivate: id: ${ shortifyId(this.id) }, url: ${ shortifyUrl(this.url) }`);

		// the url getter reads the live webContents, so the state must be captured before the view is dropped
		const stateSnapshot = this.makeStateSnapshot();

		if (this.hasIdeaRecord) {
			windowService().removeRecordFlagForAllCharts();
		}

		this.resetController();

		if (this.remoteServiceInstanceId && isDragServiceReady()) {
			await dragServiceProxy().unregister(this.remoteServiceInstanceId);
			this.remoteServiceInstanceId = undefined;
		}

		this.dropTabBrowserView();
		this.notifyLoadFinished();

		this.applyStateFields(stateSnapshot);
	}

	async dispose(): Promise<void> {
		if (this.isDisposed) {
			return;
		}

		if (this.hasIdeaRecord) {
			windowService().removeRecordFlagForAllCharts();
		}

		this.resetController();
		this.scheduler.dispose();

		if (this.remoteServiceInstanceId && isDragServiceReady()) {
			await dragServiceProxy().unregister(this.remoteServiceInstanceId);
		}

		this.dropTabBrowserView();

		this.isDisposed = true;
	}
}
