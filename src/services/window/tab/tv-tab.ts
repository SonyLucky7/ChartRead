import { Event } from 'electron';
import { t } from 'i18next';
import { Subscription } from 'rxjs';

import { webcontentTaskService } from '../../../app/webcontent-based-tasks';
import { LinkGroupName, linkingController, linkingService } from '../../../linking';
import { loggerService, LogLevel } from '../../../logger';
import { logCall } from '../../../logger/log-decorator';
import { shortifyId } from '../../../logger/log-formatter';
import { sessionStorageService, TabSessionStorage } from '../../../main/session-storage';
import { resolveEmbeddedLink } from '../../../navigation/navigation-rules';
import { notificationService } from '../../../notification';
import {
	areEqualLayouts,
	EMPTY_CHART_LAYOUT,
	LAYOUT_CHANGE,
	LAYOUT_RESTORED,
	RELOAD_TAB,
	RendererData,
	SET_TITLE,
	WATCHLIST_CHANGE,
} from '../../../tv-api';
import { getUID } from '../../../tvd-runtime/core';
import { ignorePromise, isDarwin, isLocalURI, makePromiseWithRetry, sleep } from '../../../utils';
import { askUserToCloseOrToReloadUnsavedChart, CloseOrReloadUnsavedChart } from '../../../utils/dialog-window-helper';
import {
	isChartUrl,
	isChartUrlWithParams,
	isIdeaUrl,
	isSnapshotUrl,
	isTVHostedUrl,
} from '../../../utils/tv-uri';
import { appSettingsService } from '../../app-settings-service';
import { getConfiguration } from '../../configuration';
import { BLANK_TAB_URL, DEFAULT_TAB_TITLE, DEFAULT_TAB_URL, NEW_TAB_URL } from '../../interfaces';
import { passwordManagerService } from '../../password-manager';
import { credentialHelper } from '../../password-manager/credential-helper';
import { userService } from '../../user';
import { TabbedWindow } from '../tabbed-window-imports';
import { CreateTabOptions, isSymbolInterval, Layout, TabTitle } from '../window-api';
import { windowService } from '..';
import { BYTES_IN_ONE_KBYTE, HEAP_CHECK_INTERVAL, HEAP_USAGE_CRITICAL_LIMIT, HEAP_USAGE_WARNING_LIMIT } from './heap-log-constants';
import { heapLogHelper } from './heap-log-helper';
import { PlatformPageProxy } from './platform-page-proxy';
import { SaveChangesScopeType } from './save-changes-types';
import { Tab, TabState } from './tab';
import { acceptTabTitleChangeWhenDidNavigateInPage, getCustomTabTitleFromUrl } from './tab-title-api';
import {
	restoreLayout,
	saveChartAndAwaitResult,
} from './tv-api-scripts';
import { TvTabLinkingAgent } from './tv-tab-linking-agent';

const EXECUTE_JAVASCRIPT_DELAY = 3_000;

export interface TabSaveResponse {
	scopeType: SaveChangesScopeType;
	success: boolean;
}

function normalizeUrl(url: string): string {
	if (!url || url === DEFAULT_TAB_URL) {
		return getConfiguration().urls.chart;
	}

	const resolvedLink = resolveEmbeddedLink(url)?.path;

	return resolvedLink ?? url;
}

export function createTabState(options: CreateTabOptions): TabState {
	const user = userService().getCurrentUser();

	let url: string;
	let title: string;

	if (user.isAnonymous || !user.session) {
		url = DEFAULT_TAB_URL;
		title = DEFAULT_TAB_TITLE;
	}
	else {
		url = NEW_TAB_URL;
		title = t('New tab');
	}

	const tabState: TabState = {
		persistentId: options.id ?? getUID(),

		url: normalizeUrl(options.url ?? url),
		title: getCustomTabTitleFromUrl(options.url) ?? options.title ?? title,
		symbol: options.symbol,
		watchlist: options.watchlist,

		active: options.active ?? true,
		fullscreen: Boolean(options.fullscreen),
		pinned: Boolean(options.pinned),
	};

	return tabState;
}

export class TvTab extends Tab {
	currentLayout?: Layout;
	watchlist?: string;

	private zoomChanged = false;

	private shouldRestoreOnLoad = true;

	private tabTitleCached?: TabTitle = '';
	private isTitleCanUpdate?: boolean;

	private jsExecutionTimeouts: NodeJS.Timeout[] = [];

	private taskNotificationsSubscription?: Subscription;

	private sessionStorage: TabSessionStorage;

	private readonly linkingAgent: TvTabLinkingAgent;
	private platformProxy: PlatformPageProxy | null = null;

	static createTab(state: TabState): TvTab {
		const tab = new TvTab(state.persistentId);

		tab.internalApplyState(state);

		return tab;
	}

	private constructor(id: string) {
		super(id);
		this.isTitleCanUpdate = false;
		this.sessionStorage = new TabSessionStorage(id, sessionStorageService().getStorage());
		this.linkingAgent = new TvTabLinkingAgent(
			this.id,
			linkingController(),
			() => (this.getWindowRef()?.isFocused() ?? false) && this.active,
		);
		this.linkingAgent.linkGroup.subscribe((groupName: LinkGroupName | null) => {
			this.controller?.setLinkColor(groupName);
		});
	}

	public changeSymbol(symbol: string): void {
		this.platformProxy?.setLinkValues({ symbol });
	}

	public async saveChart(scopeType: SaveChangesScopeType): Promise<TabSaveResponse | null> {
		if (
			!this.url ||
			!(isChartUrl(this.url) || isChartUrlWithParams(this.url)) ||
			!this.isBrowserViewValid()
		) {
			return null;
		}

		loggerService().info(`Try to save layout ${ this.url }`);
		loggerService().debug(`Tab.saveChart(): tabId = ${ this.id }, url = ${ this.url }, scopeType = ${ scopeType }`);

		const saveChartResolveMs = 3_000;
		const saveChartResolve = [SaveChangesScopeType.Group, SaveChangesScopeType.Window, SaveChangesScopeType.App].includes(scopeType) ? saveChartResolveMs : 0;
		const codeSaveChart = `(${ saveChartAndAwaitResult.toString() })(${ JSON.stringify(scopeType) }, ${ saveChartResolve })`;

		const saveChartTimeoutMs = 30_000;
		const saveChartTimedOut = 'timed-out';

		try {
			const response = await Promise.race<TabSaveResponse | typeof saveChartTimedOut>([
				this.executeJavaScript<TabSaveResponse>(codeSaveChart),
				sleep(saveChartTimeoutMs).then(() => saveChartTimedOut),
			]);

			if (response === saveChartTimedOut) {
				loggerService().error(
					`Tab.saveChart: executeJavaScript error: timed out after ${ saveChartTimeoutMs }ms: tabId = ${ this.id }, url = ${ this.url }, scopeType = ${ scopeType }`
				);
				return { scopeType, success: false };
			}

			return response;
		}
		catch (error) {
			loggerService().error(`Tab.saveChart: executeJavaScript error: tabId = ${ this.id }, url = ${ this.url }, scopeType = ${ scopeType }`, error);
			return { scopeType, success: false };
		}
	}

	protected override onControllerReady(): void {
		super.onControllerReady();
		this.controller?.setLinkColor(linkingService().getGroupName(this.id))?.catch(err => loggerService().warn(`ITabController.setLinkColor(): ${ JSON.stringify(err) }`));
	}

	@logCall
	override async checkCanBeUnloaded(): Promise<boolean> {
		const window = this.getWindowRef();

		if (!window || this.isDisposed || !this.url || !isChartUrl(this.url)) {
			return true;
		}

		const message = await this.dispatchBeforeUnloadEvent();
		if (message === undefined || message.length === 0) {
			return true;
		}

		loggerService().info(`Tab id: ${ shortifyId(this.id) } cannot be unloaded. Will ask user to close unsaved`);

		const user = userService().getCurrentUser();

		const button = await askUserToCloseOrToReloadUnsavedChart(window, this, true, !user.isAnonymous && !!user.session);
		if (button === CloseOrReloadUnsavedChart.SaveOrReload) {
			const tabbedWindow = windowService().findWindow({ refWindow: window }) as TabbedWindow;
			tabbedWindow.setActiveTab(this, true);
			const saveResponse = await this.saveChart(SaveChangesScopeType.Chart);

			return saveResponse?.success ?? true;
		}
		return button === CloseOrReloadUnsavedChart.Close;
	}

	@logCall
	private async restoreChartLayout(): Promise<void> {
		try {
			const restoreLayoutExpr = `(${ restoreLayout.toString() })(${ JSON.stringify(this.currentLayout) })`;
			await this.executeJavaScript(restoreLayoutExpr);
		}
		catch (err) {
			loggerService().error('[Tab.restoreChartLayout()] restore layout failed', err);
		}
	}

	@logCall
	private setupTVViewEvents(): void {
		this.sessionStorage.setupSessionStorageApi(this.browserView.webContents);
		this.browserView.webContents
			.on('enter-html-full-screen', () => {
				loggerService().info(`Tab id: ${ shortifyId(this.id) } enter-html-fullscreen`);
				this.isFullscreened = true;
			})
			.on('leave-html-full-screen', () => {
				loggerService().info(`Tab id: ${ shortifyId(this.id) } exit-html-fullscreen`);
				this.isFullscreened = false;
			})
			.on('will-prevent-unload', (ev: Event) => {
				// Always allow to unload any page.
				// For chart pages checking for unsaved changes should occur outside of this callback,
				// so if it has been called, then logic actually allow this tab to be unloaded.
				//
				// see [TVD-177]: https://jira.xtools.tv/browse/TVD-177
				ev.preventDefault();
			})
			.on('ipc-message', (ev, channel, ...args: unknown[]) => {
				this.handleIpcCommunication(channel, ...args);
			})
			.on('page-title-updated', (ev, title) => {
				loggerService().debug(`Tab id: ${ shortifyId(this.id) } page-title-updated`);
				this.updateTabTitle(title);
			})
			.on('dom-ready', () => {
				this.handleDomReady();
			})
			.on('did-navigate-in-page', (ev: Event, targetUrl: string) => {
				loggerService().debug(`Tab id: ${ shortifyId(this.id) } did-navigate-in-page: ${ targetUrl }`);

				if (acceptTabTitleChangeWhenDidNavigateInPage(targetUrl)) {
					const title = getCustomTabTitleFromUrl(targetUrl);

					if (title !== undefined) {
						this.title = title;
					}
				}
			});
	}

	private updateTabTitle(title: TabTitle): void {
		const chartOrDefaultUrl = (): boolean => {
			const currentUrl = this.getURL();

			if (isIdeaUrl(currentUrl)) {
				return false;
			}

			return currentUrl === DEFAULT_TAB_URL || isChartUrl(currentUrl);
		};

		if (typeof title === 'string') {
			if (this.isDisposed || chartOrDefaultUrl()) {
				return;
			}

			title = getCustomTabTitleFromUrl(this.getURL()) ?? title;
		}
		else if (typeof this.title !== 'string') {
			title = this.mergeRendererData(this.title, title);
		}

		if (!this.isTitleCanUpdate) {
			this.tabTitleCached = title;

			return;
		}

		this.title = title;
		this.tabTitleCached = '';
	}

	private mergeRendererData(first: RendererData, second: RendererData): RendererData {
		if (first.symbol !== second.symbol) {
			return second;
		}

		const isEmptyValue = (value: string | number | string[]): boolean => {
			// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
			// eslint-disable-next-line no-mixed-operators
			return value === '' || value === 0 || typeof value === 'object' && value.length === 0;
		};

		const mergeData = (propKey: string): void => {
			const firstRecord = first as unknown as Record<string, string | number | string[]>;
			const secondRecord = second as unknown as Record<string, string | number | string[]>;
			if (isEmptyValue(secondRecord[propKey])) {
				secondRecord[propKey] = firstRecord[propKey];
			}
		};

		Object.keys(second)
			.forEach((key) => mergeData(key));

		return second;
	}

	private handleDomReady(): void {
		if (!this.isBrowserViewValid()) {
			return;
		}

		if (this.url) {
			if (isLocalURI(this.url)) {
				this.handleDomReadyForLocalFiles();
			}
			else {
				this.handleDomReadyForNonLocalFiles();
			}
		}

		if (!this.taskNotificationsSubscription) {
			this.taskNotificationsSubscription = webcontentTaskService().taskNotifications.subscribe(() => {
				this.executeTasks()
					.catch((error) => {
						loggerService().error('TvTab(): webContentTaskService().taskNotifications.subscribe', error);
					});
			});
		}
	}

	private handleDomReadyForLocalFiles(): void {
		this.allowTitleUpdate();
	}

	private handleDomReadyForNonLocalFiles(): void {
		loggerService().debug(`Tab id: ${ shortifyId(this.id) } dom-ready`);

		if (this.getURL() !== BLANK_TAB_URL) {
			this.updateViewZoom();
		}

		if (isDarwin()) {
			ignorePromise(this.browserView.webContents.insertCSS('html{ -webkit-app-region: none !important;}'));
		}

		this.executeTasks()
			.catch((error) => {
				loggerService().error('TvTab.executeTasks(): handleDomReadyForNonLocalFiles() error', error);
			});

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		global.setTimeout(() => this.applyTokyoNight(), isDarwin() ? EXECUTE_JAVASCRIPT_DELAY : 1000);

		const timeout = global.setTimeout(() => {
			if (this.isDisposed || !this.isBrowserViewValid()) {
				return;
			}

			this.setupCredentialsManager();

			this.setupPlatformIntegration();
		}, EXECUTE_JAVASCRIPT_DELAY);

		this.setupHeapLog();

		this.jsExecutionTimeouts.push(timeout);

		this.setupTitleUpdates();

		notificationService().allowAlertNotificationsSoundOnce();
	}

	private setupPlatformIntegration(): void {
		this.platformProxy = PlatformPageProxy.makePlatformProxy(this.browserView.webContents);
		this.platformProxy?.initializePlatformApiSubscriptions();
		this.linkingAgent.activate(this.platformProxy);
	}

	private tearDownPlatformIntegration(): void {
		this.platformProxy = null;
		this.linkingAgent.deactivate();
	}

	private applyTokyoNight(): void {
		if (!this.isBrowserViewValid()) {
			return;
		}

		let code = `
		document.body.insertAdjacentHTML('beforebegin',\`<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
			<defs>
				<filter id="filter">
					<feComponentTransfer in="SourceGraphic">
						<feFuncR type="linear" slope="1.9" intercept="-0.3"></feFuncR>
						<feFuncG type="linear" slope="1.9" intercept="-0.3"></feFuncG>
						<feFuncB type="linear" slope="1.9" intercept="-0.3"></feFuncB>
					</feComponentTransfer>
					<feGaussianBlur stdDeviation="15"></feGaussianBlur>
					<feComposite in2="SourceGraphic" operator="lighter"></feComposite>
					<feComponentTransfer>
						<feFuncR type="linear" slope="1.35" intercept="-0.1"></feFuncR>
						<feFuncG type="linear" slope="1.35" intercept="-0.1"></feFuncG>
						<feFuncB type="linear" slope="1.35" intercept="-0.1"></feFuncB>
					</feComponentTransfer>
				</filter>
			</defs>
		</svg>\`);`;

		if (windowService().getTokyoNightStatus()) {
			code += this.codeTurnOnTokyoNight;
		}

		this.executeJavaScript(code)
			.catch((error): void => {
				loggerService().error('TvTab.tokyoNight(): view.webContents.executeJavaScript() error', error);
			});

		this.browserView.webContents.insertCSS(
			'html.theme-dark .chart-page.tokyo-night{ filter: url(#filter);} html.theme-dark .tv-main.tokyo-night{ filter: url(#filter);}'
		)
			.catch((error) => {
				loggerService().error('TvTab.tokyoNight(): view.webContents.insertCSS() error', error);
			});
	}

	private handleIpcCommunication(channel: string, ...args: unknown[]): void {
		if (!this.isBrowserViewValid()) {
			return;
		}

		switch (channel) {
			case SET_TITLE: {
				const title = args[0] as string;
				this.updateTabTitle(title);
				break;
			}
			case RELOAD_TAB: {
				loggerService().debug(`Tab id: ${ shortifyId(this.id) } tvd:reload-tab`);
				this.getHostWindow()?.reloadTab(this.id);
				break;
			}
			case LAYOUT_CHANGE: {
				const layoutSymbol = args[0] as Layout;

				if (!layoutSymbol) {
					return;
				}

				this.onLayoutChange(layoutSymbol);
				break;
			}
			case WATCHLIST_CHANGE: {
				this.watchlist = args[0] as string;
				break;
			}
			case LAYOUT_RESTORED: {
				this.allowTitleUpdate();
				break;
			}
		}
	}

	private onLayoutChange(newLayout: Layout): void {
		if (this.currentLayout && areEqualLayouts(newLayout, this.currentLayout)) {
			return;
		}

		this.shouldRestoreOnLoad = false;
		this.currentLayout = newLayout;
	}

	private setupTitleUpdates(): void {
		const isChartUri = isChartUrl(this.getURL());
		const isSaveSymbolEnabled = appSettingsService().get('saveSymbolInterval');

		if (!isChartUri || !isSaveSymbolEnabled || !this.currentLayout) {
			this.allowTitleUpdate();
			return;
		}

		const timeout = global.setTimeout(() => {
			this.updateLayout()
				.then(() => {
					const codeTVDRestore = `(
						()=>{
							window?.TVD?.layoutRestored();
							window?.TVD?.log({ message: 'TvTab.setupTitleUpdates(): Layout restored.', level: ${ LogLevel.Debug } });
						})()`;
					return this.executeJavaScript(codeTVDRestore);
				})
				.catch(err => {
					loggerService().error('[Tab(dom-ready)] Subscribe to symbol change error', err);
					this.allowTitleUpdate();
				});
		}, EXECUTE_JAVASCRIPT_DELAY);

		this.jsExecutionTimeouts.push(timeout);
	}

	private async updateLayout(): Promise<void> {
		if (this.currentLayout && this.shouldRestoreOnLoad) {
			const retryAttempts = 6;
			const retryInv = 6000;
			await makePromiseWithRetry(this.restoreChartLayout(), retryAttempts, retryInv);
			this.shouldRestoreOnLoad = false;

			return;
		}
		this.currentLayout = undefined;
		this.allowTitleUpdate();
	}

	private allowTitleUpdate(): void {
		this.isTitleCanUpdate = true;

		if (this.tabTitleCached) {
			this.title = this.tabTitleCached;
			this.tabTitleCached = undefined;
		}
	}

	private async executeTasks(): Promise<void> {
		const hasValidUrl = !!this.getURL() && isTVHostedUrl(this.url) && !isSnapshotUrl(this.url);

		if (this.isLoading || !hasValidUrl || !this.isBrowserViewValid()) {
			return;
		}

		const tasks = webcontentTaskService().getTasks();

		for (const task of tasks) {
			if (!webcontentTaskService().canStartTask(task.id)) {
				continue;
			}

			if (!this.isBrowserViewValid()) {
				continue;
			}

			try {
				webcontentTaskService().startTask(task.id);
				const result = await task.action(this.browserView.webContents);
				webcontentTaskService().setTaskFinished(task.id, result);
			}
			catch (err) {
				loggerService().error('Error executing task', err);

				webcontentTaskService().invalidateTask(task.id);
			}
		}
	}

	private setupCredentialsManager(): void {
		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line no-mixed-operators
		if (this.url && !isChartUrl(this.url) || !passwordManagerService().canUseStorageByService()) {
			return;
		}

		this.executeJavaScript(`(${ credentialHelper.toString() })();`)
			.catch((error) =>
				loggerService().error('[Tab.setupCredentialsManager()] Credential helper execute error', error)
			);
	}

	private setupHeapLog(): void {
		this.executeJavaScript(`(${ heapLogHelper.toString() })(${ HEAP_CHECK_INTERVAL }, ${ BYTES_IN_ONE_KBYTE }, ${ HEAP_USAGE_WARNING_LIMIT }, ${ HEAP_USAGE_CRITICAL_LIMIT });`)
			.catch((err) => {
				loggerService().error('[Tab.setupHeapLog()] heapLogHelper execute error', err);
			});
	}

	private updateViewZoom(): void {
		const winService = windowService();

		// If zoom changed then we get winService.getZoomFactor() else we get zoom factor value from cache
		const zoomFactor = this.zoomChanged ? winService.getZoomFactor() : this.zoomFactor();
		this.zoomChanged = true;
		ignorePromise(winService.zoom(zoomFactor, true));
	}

	override async beforeLoad(targetUrl: string): Promise<void> {
		await super.beforeLoad(targetUrl);
		await this.sessionStorage.initStorageCache(targetUrl);
	}

	protected override makeStateSnapshot(): TabState {
		const baseState = super.makeStateSnapshot();

		baseState.symbol = appSettingsService().get('saveSymbolInterval') ? this.currentLayout : '';
		baseState.watchlist = this.watchlist;

		return baseState;
	}

	override internalApplyState(state: TabState): void {
		super.internalApplyState(state);

		if (appSettingsService().get('saveSymbolInterval')) {
			this.restoreLayoutState(state);
		}

		this.watchlist = state.watchlist;
	}

	protected override onTabBrowserViewCreated(): void {
		super.onTabBrowserViewCreated();
		this.setupTVViewEvents();
		this.linkingAgent.unregisterCurrentIpcHandlers?.();
		this.linkingAgent.registerIpcHandlers(this.browserView.webContents.ipc);
	}

	protected override onBeforeBrowserViewDrop(): void {
		this.tearDownPlatformIntegration();
		this.taskNotificationsSubscription?.unsubscribe();
		this.taskNotificationsSubscription = undefined;

		super.onBeforeBrowserViewDrop();
	}

	/**
	 * for backwards compatibility:
	 * migrates the symbol linking
	 * to the more complicated (symbol + interval + time + data range) linking type
	 *
	 * @private
	 */
	private restoreLayoutState(state: TabState): void {
		// TODO: uncomment in https://jira.xtools.tv/browse/TVD-2082
		// 'currentLayout' field means that user is already migrated
		// if (state?.currentLayout) {
		// 	this.currentLayout = state?.currentLayout;
		// 	return;
		// }

		// nothing to migrate
		if (!state?.symbol) {
			return;
		}

		const { symbol } = state;

		if (typeof symbol === 'string') {
			this.currentLayout = {
				layoutType: EMPTY_CHART_LAYOUT,
				charts: [{ active: true, interval: '', symbol }],
			};
			return;
		}
		else if (isSymbolInterval(symbol)) {
			this.currentLayout = {
				layoutType: EMPTY_CHART_LAYOUT,
				charts: [{ active: true, interval: symbol.interval, symbol: symbol.symbol }],
			};
			return;
		}
		else {
			this.currentLayout = symbol;
			return;
		}
	}

	override async deactivate(): Promise<void> {
		await super.deactivate();

		this.jsExecutionTimeouts.forEach((timeout) => clearTimeout(timeout));
		this.jsExecutionTimeouts = [];
	}

	override async dispose(): Promise<void> {
		await super.dispose();

		this.linkingAgent.dispose();

		this.jsExecutionTimeouts.forEach((timeout) => clearTimeout(timeout));
	}
}
