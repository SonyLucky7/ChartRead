import { app, BaseWindow, BrowserWindow, clipboard, KeyboardEvent, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import i18next from 'i18next';
import { BehaviorSubject, Observable } from 'rxjs';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { getNavigationAction, NavigationAction } from '../../navigation/navigation-rules';
import { persistenceService } from '../../persistence';
import { isDarwin, isLocalURI, isValidUrl, isWin32, sleep, UndoStack } from '../../utils';
import { appEventService } from '../app-event-service';
import { createCrashTestView } from '../crashtest-service';
import { localeService } from '../locale';
import { mainService } from '../main-service';
import { SettingsWindowOptions } from '../settings/settings-tabs';
import { showSettingsWindow } from '../settings/settings-window';
import { themeManager } from '../settings/theme';
import { createTabMonitorView } from '../tab-monitoring';
import { autoUpdateService, UpdateStatus } from '../update';
import { userService } from '../user';
import { windowService } from '../window';
import { MenuWindow, MenuWindowType } from '../window/menu-window';
import { MenuType } from '../window/menu-window-types';
import { openLink } from '../window/tab/open-link';
import { TabbedWindow } from '../window/tabbed-window-imports';
import { WINDOW_HEADER_HEIGHT, WindowState } from '../window/window-api';
import { IMainMenuService, MAIN_MENU_SERVICE_CONTRACT } from './imain-menu-service';

const MAIN_MENU_WIDTH = 400;
const MAIN_MENU_HEIGHT = 700;

/**
 * In newer version of Electron (since we switched to Electron 38) some APIs(Like MenuItem.click)
 * work with BaseWindow interface to be generic.
 * However, we sill use only BrowserWindow class through out the app.
 */
function ensureBrowserWindow(window: BaseWindow | undefined): BrowserWindow | undefined {
	if (window === undefined) {
		return undefined;
	}

	if (window instanceof BrowserWindow) {
		return window;
	}

	loggerService().error(`${ window.id } Window is not an instance of BrowserWindow`);
	return undefined;
}

@ExposeSingletonService(MAIN_MENU_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('MainMenuService')
export class MainMenuService implements IMainMenuService {
	private readonly navigationActionForVerifyingClipboard = [NavigationAction.Inplace, NavigationAction.OpenTab];

	private menuWindow: MenuWindow | null = null;
	private sourceWindow: TabbedWindow | null = null;
	private parentId: string = '';

	private readonly menuOpened = new BehaviorSubject<boolean>(false);
	public readonly menuOpenedChange: Observable<boolean> = this.menuOpened.asObservable();

	constructor() {
		this.createMenuWindow();
		if (isDarwin()) {
			this.setupDarwinTopBarUpdates();
		}
	}

	private createMenuWindow(): MenuWindow {
		this.menuWindow = new MenuWindow(
			MenuWindowType.MainMenu,
			MAIN_MENU_WIDTH,
			MAIN_MENU_HEIGHT,
			true
		);

		this.menuWindow.windowRef.on('hide', () => {
			this.menuOpened.next(false);
		});

		return this.menuWindow;
	}

	private filterMenuAccelerator(event: KeyboardEvent, targetHandler: () => void): void {
		// there is a bug on the macOs when the mouse is moving triggeredByAccelerator is not working
		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line no-mixed-operators
		if (event.triggeredByAccelerator || event.metaKey) {
			return;
		}

		targetHandler();
	}

	private buildTopBarMenu(): void {
		const separator: MenuItemConstructorOptions = { type: 'separator' };

		const settings: MenuItemConstructorOptions = {
			id: 'settings',
			label: i18next.t('Settings...'),
			click: (i: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => this.showSettings(ensureBrowserWindow(wnd)));
			},
			registerAccelerator: false,
			accelerator: 'CommandOrControl+,',
		};

		const zoomIn: MenuItemConstructorOptions = {
			id: 'zoomIn',
			label: i18next.t('Zoom +'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => {
					this.increaseZoom()
						.catch((error) => {
							loggerService().error('MainMenuService.buildTopBarMenu(): increaseZoom() error', error);
						});
				});
			},
			registerAccelerator: false,
			accelerator: 'CommandOrControl+numadd',
		};

		const zoomOut: MenuItemConstructorOptions = {
			id: 'zoomOut',
			label: i18next.t('Zoom -'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => {
					this.decreaseZoom()
						.catch((error) => {
							loggerService().error('MainMenuService.buildTopBarMenu(): decreaseZoom() error', error);
						});
				});
			},
			registerAccelerator: false,
			accelerator: 'CommandOrControl+-',
		};

		const zoomReset: MenuItemConstructorOptions = {
			id: 'zoomReset',
			label: i18next.t('Reset to 100%'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => {
					windowService().zoom(1)
						.catch((error) => {
							loggerService().error('MainMenuService.buildTopBarMenu(): windowService().zoom(1) error', error);
						});
				});
			},
			registerAccelerator: false,
			accelerator: 'CommandOrControl+0',
		};

		const zoom: MenuItemConstructorOptions = {
			id: 'zoom',
			role: 'zoom',
			label: `${ i18next.t('Zoom') } ${ Math.round(windowService().getZoomFactor() * 100) }%`,
			submenu: Menu.buildFromTemplate([
				zoomIn,
				zoomOut,
				zoomReset,
			]),
		};

		const newTab: MenuItemConstructorOptions = {
			id: 'newTab',
			label: i18next.t('New tab'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => this.createNewTab(ensureBrowserWindow(wnd)));
			},
			registerAccelerator: false,
			accelerator: isDarwin() ? 'Command+T' : 'Control+T',
		};

		const newWindow: MenuItemConstructorOptions = {
			id: 'newWindow',
			label: i18next.t('New window'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => this.createNewWindow());
			},
			registerAccelerator: false,
			accelerator: isDarwin() ? 'Command+N' : 'Control+N',
		};

		const undoTop = mainService().undo.top;
		const undo: MenuItemConstructorOptions | null = undoTop !== undefined
			? {
				id: 'undo',
				label: UndoStack.undoItemDescription(undoTop),
				click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
					this.filterMenuAccelerator(event, () => this.undo());
				},
				registerAccelerator: false,
				accelerator: 'CommandOrControl+Shift+T',
			}
			: null;

		const openLinkFromClipboard: MenuItemConstructorOptions = {
			id: 'openLinkFromClipboard',
			label: i18next.t('Open link from clipboard'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent) => {
				this.filterMenuAccelerator(event, () => this.openLinkFromClipboard(ensureBrowserWindow(wnd)));
			},
		};

		const currentTheme = themeManager().getCurrentTheme();
		const themeMenuItems: MenuItemConstructorOptions[] = [];

		for (const theme of themeManager().availableThemes()) {
			themeMenuItems.push({
				id: `theme-${ theme.id }`,
				label: theme.label,
				type: 'checkbox',
				checked: currentTheme === theme.id,
				click: (): void => {
					loggerService().info(`Main Menu: Change Theme to "${ theme.label }"`);
					themeManager().themeChange.next(theme.id);
				},
			});
		}

		const theme: MenuItemConstructorOptions = {
			id: 'theme',
			label: i18next.t('Color theme'),
			submenu: Menu.buildFromTemplate(themeMenuItems),
		};

		const quit: MenuItemConstructorOptions = {
			id: 'quit',
			role: 'quit',
			label: isWin32() ? i18next.t('Exit') : i18next.t('Quit'),
			click: (item: MenuItem, wnd: BaseWindow | undefined, event: KeyboardEvent): void => {
				this.filterMenuAccelerator(event, () => this.exit());
			},
			registerAccelerator: false,
			accelerator: isDarwin() ? 'Command+Q' : 'Control+Shift+Q',
		};

		const openCrashView: MenuItemConstructorOptions = {
			id: 'openCrashView',
			label: i18next.t('Open Crash View'),
			click: (): void => {
				createCrashTestView()
					.catch((error) => {
						loggerService().error('MainMenuService.buildTopBarMenu(): createCrashTestView() error', error);
					});
			},
		};

		const isDebugMode = mainService().isDebugMode();
		const appMenu: MenuItemConstructorOptions[] = [
			settings,
			separator,
			zoom,
			separator,
			newTab,
			newWindow,
			undo,
			openLinkFromClipboard,
			separator,
			theme,
			separator,
			quit,
			isDebugMode ? separator : null,
			isDebugMode ? openCrashView : null,
		].filter(item => item !== null);

		const editMenu: MenuItemConstructorOptions[] = [
			{ id: 'undo', role: 'undo', label: i18next.t('Undo') },
			{ id: 'redo', role: 'redo', label: i18next.t('Redo') },
			separator,
			{ id: 'cut', role: 'cut', label: i18next.t('Cut') },
			{ id: 'copy', role: 'copy', label: i18next.t('Copy') },
			{ id: 'paste', role: 'paste', label: i18next.t('Paste') },
			{ id: 'selectAll', role: 'selectAll', label: i18next.t('Select all') },
		];

		const windowMenu: MenuItemConstructorOptions[] = [
			{ id: 'hide', role: 'hide', label: i18next.t('Hide TradingView') },
			{ id: 'hideOthers', role: 'hideOthers', label: i18next.t('Hide others') },
			{ id: 'minimize', role: 'minimize', label: i18next.t('Minimize') },
		];

		const viewMenu: MenuItemConstructorOptions[] = [
			{ id: 'togglefullscreen', role: 'togglefullscreen', label: i18next.t('Toggle full screen') },
		];

		if (isDebugMode) {
			viewMenu.push({ id: 'toggleDevTools', role: 'toggleDevTools', label: i18next.t('Toggle developer tools') });
		}

		const menuTemplate: MenuItemConstructorOptions[] = [
			{
				id: 'appMenu',
				role: 'appMenu',
				label: app.name,
				submenu: appMenu,
			},
			{
				id: 'editMenu',
				role: 'editMenu',
				label: i18next.t('Edit'),
				submenu: editMenu,
			},
			{
				id: 'windowMenu',
				role: 'window',
				label: i18next.t('Window'),
				submenu: windowMenu,
			},
			{
				id: 'viewMenu',
				role: 'viewMenu',
				label: i18next.t('View'),
				submenu: viewMenu,
			},
		];

		Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
	}

	private setupDarwinTopBarUpdates(): void {
		const rebuildTopBarMenu = (): void => {
			this.buildTopBarMenu();
		};

		appEventService().startup.subscribe(rebuildTopBarMenu);
		userService().userChange.subscribe(rebuildTopBarMenu);
		persistenceService().stateRestored.subscribe(rebuildTopBarMenu);
		windowService().zoomChange.subscribe(rebuildTopBarMenu);
		mainService().undo.entriesChange.subscribe(rebuildTopBarMenu);
		localeService().localeChange.subscribe(lang => {
			if (lang === '') {
				return;
			}

			rebuildTopBarMenu();
		});

		themeManager().themeChange.subscribe(rebuildTopBarMenu);
	}

	private getMenuWindow(): MenuWindow {
		return this.menuWindow && !this.menuWindow.isDestroyed()
			? this.menuWindow
			: this.createMenuWindow();
	}

	private isValidClipboard(): boolean {
		const textUrl = clipboard.readText();

		const isUrlValid = textUrl && isValidUrl(textUrl);

		if (!isUrlValid) {
			return false;
		}

		const navigationActionOfCurrentUrl = getNavigationAction(textUrl);
		const canOpenUrlInApp = this.navigationActionForVerifyingClipboard.includes(navigationActionOfCurrentUrl);

		if (!canOpenUrlInApp) {
			return false;
		}

		return true;
	}

	public recreateMenuWindow(): void {
		this.createMenuWindow();
	}

	public getMenuOpened(): boolean {
		return this.menuOpened.getValue();
	}

	public setMenuOpened(isOpened: boolean): void {
		this.menuOpened.next(isOpened);
	}

	@logCall
	public async showMenu(wndId: string): Promise<void> {
		const wnd = windowService().findWindow({ windowId: wndId });

		if (!wnd) {
			return;
		}

		this.sourceWindow = wnd;
		if (this.menuOpened.getValue()) {
			this.menuOpened.next(false);

			if (wndId === this.parentId) {
				this.parentId = '';
				return;
			}
		}

		const wndPosition = wnd.windowRef.getBounds();
		if (!wndPosition) {
			return;
		}

		const menu = this.getMenuWindow();
		const menuParentWnd = menu.windowRef.getParentWindow();

		if (
			menuParentWnd && !menuParentWnd.isDestroyed() &&
			menuParentWnd.id === wnd.windowRef.id &&
			wndId === this.parentId && menu.windowRef.isVisible()
		) {
			this.hideMenu();
			return;
		}

		menu.setInputEvents(wnd.windowRef);
		menu.attachToWindow(wnd.windowRef);

		this.parentId = wndId;

		const activeTabUrl = wnd.activeTab?.getURL();
		const isActiveTabUrlLocal = activeTabUrl && isLocalURI(activeTabUrl);

		const locale = localeService().currentLocale();
		const undoTop = mainService().undo.top;
		const undoLabel = undoTop ? UndoStack.undoItemDescription(undoTop) : '';
		const user = userService().getCurrentUser();
		const isDebugMode = mainService().isDebugMode();
		const updateStatus = autoUpdateService().getStatus();
		const isUpdateAvailable = updateStatus === UpdateStatus.ReadyToInstall;
		const systemRequirementsUnmet = updateStatus === UpdateStatus.SystemRequirementsUnmet;
		const windowState = wnd.getWindowState();
		const isInFullscreenOnWin = (windowState === WindowState.FullscreenWithPanel || windowState === WindowState.Fullscreen) && isWin32();
		const zoom = isActiveTabUrlLocal ? undefined : Math.round(windowService().getZoomFactor() * 100);
		const isValidClipboard = this.isValidClipboard();

		await menu.loadMenu({
			remoteServiceInstanceId: wnd.remoteServiceInstanceId,
			type: MenuType.Main,
			user: {
				name: user.username,
				avatar: user.userpic,
				isPro: user.isPro,
				isAnonymous: user.isAnonymous,
				userPlanBadgeName: user.userPlanBadgeName,
			},
			locale,
			zoom,
			undoLabel,
			systemRequirementsUnmet,
			isUpdateAvailable,
			isInFullscreenOnWin,
			isValidClipboard,
			isDebugMode,
		});

		const { x, y } = menu.getWin32PositionCorrection(wndPosition, wnd);
		const menuPosition = {
			x: wndPosition.x + wndPosition.width - MAIN_MENU_WIDTH - x - 2,
			y: wndPosition.y + y + WINDOW_HEADER_HEIGHT,
		};

		this.menuOpened.next(true);
		menu.show(wnd, menuPosition);
	}

	@logCall
	public hideMenu(isNoFocusParent?: boolean): void {
		if (this.menuWindow === null) {
			return;
		}

		this.menuOpened.next(false);
		this.parentId = '';
		this.menuWindow.hide(isNoFocusParent);
	}

	@logCall
	public signIn(): void {
		this.hideMenu();
		userService().doSignIn('main_menu');
	}

	@logCall
	public openUserPage(user: string): void {
		if (this.sourceWindow === null) {
			return;
		}

		this.hideMenu();

		const hostUrl = localeService().getLocaleAwareHost();
		this.sourceWindow.createAndAddTab({ title: `${ i18next.t('Trader') } ${ user }`, url: `${ hostUrl }u/${ user }/` })
			.catch((error) => {
				loggerService().error('MainMenuService.openUserPage(): currentWindow.createAndAddTab() error', error);
			});
	}

	@logCall
	public openLink(url: string): void {
		loggerService().info(`MainMenuService.openLink(link: ${ url })`);
		this.hideMenu();
		openLink(url);
	}

	@logCall
	public updateAndRelaunch(): void {
		this.hideMenu();

		app.relaunch();
		app.quit();
	}

	@logCall
	public showSettings(wnd?: BrowserWindow, options?: SettingsWindowOptions): void {
		this.hideMenu();

		const currentWindow = wnd ?? this.sourceWindow?.windowRef;
		showSettingsWindow(currentWindow, options)
			.catch((error) => {
				loggerService().error('MainMenuService.showSettings(): showSettingsWindow() error', error);
			});
	}

	@logCall
	public createNewTab(wnd?: BrowserWindow): void {
		if (!wnd && this.sourceWindow === null) {
			return;
		}

		const tabbedWindow = wnd ? windowService().findWindow({ refWindow: wnd }) : this.sourceWindow;
		if (!tabbedWindow) {
			return;
		}

		this.hideMenu();
		tabbedWindow.createAndAddTab({})
			.catch((error) => {
				loggerService().error('MainMenuService.createNewTab(): tabbedWindow.createAndAddTab() error', error);
			});
	}

	@logCall
	public createNewWindow(): void {
		this.hideMenu();
		windowService().newWindow();
	}

	@logCall
	public undo(): void {
		this.hideMenu();
		mainService().undo.undo();
	}

	@logCall
	public openLinkFromClipboard(wnd?: BrowserWindow): void {
		const currentWindow = wnd ?? this.sourceWindow?.windowRef;

		if (!currentWindow) {
			return;
		}

		const textUrl = clipboard.readText();

		if (!this.isValidClipboard() || !openLink(textUrl, currentWindow)) {
			loggerService().warn('Open link prevented - not supported in application');
		}

		this.hideMenu();
	}

	@logCall
	public increaseZoom(): Promise<number | undefined> {
		return windowService().zoom('+');
	}

	@logCall
	public decreaseZoom(): Promise<number | undefined> {
		return windowService().zoom('-');
	}

	@logCall
	public exit(): void {
		this.hideMenu();
		app.quit();
	}

	@logCall
	public async openCrashView(): Promise<void> {
		this.hideMenu(true);
		await sleep(100);
		createCrashTestView()
			.catch((error) => {
				loggerService().error('MainMenuService.openCrashView(): createCrashTestView() error', error);
			});
	}

	public async openTabMonitorView(): Promise<void> {
		this.hideMenu(true);
		await sleep(100);
		try {
			createTabMonitorView();
		}
		catch (error) {
			loggerService().error('MainMenuService.openTabCPUMonitorView(): createTabCpuMonitor()', error);
		}
	}
}
