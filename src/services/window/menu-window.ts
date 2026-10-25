import { app, BrowserWindow, Event, Input, ipcMain, screen } from 'electron';
import * as path from 'path';
import { Subscription } from 'rxjs';

import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { HIDE_MENU } from '../../tv-api/tvd-channels';
import { Disposable } from '../../tvd-runtime/core';
import { InputProcessor, isDarwin, isWin32, Position } from '../../utils';
import { appEventService } from '../app-event-service';
import { mainMenuService } from '../main-menu-service';
import { mainService } from '../main-service';
import { themeManager } from '../settings/theme';
import { MenuData } from './menu-window-types';
import { TabbedWindowBase } from './tabbed-window';
import { WindowState } from './window-api';
import { windowService } from '.';

export const enum MenuWindowType {
	MainMenu = 'main-menu',
	WithMenu = 'with-menu',
	TabGroup = 'tab-group',
}

@logCallName('MenuWindow')
export class MenuWindow implements Disposable {
	private readonly menuType: MenuWindowType;
	private readonly menuHeight: number;
	private readonly menuWidth: number;
	private shouldSubscribeToMenuClose: boolean;

	private readonly menuUrl: string;
	private isLoading = false;
	windowRef: BrowserWindow;
	private inputProcessor?: InputProcessor;
	private appEventServiceSubscription: Subscription;
	private menuCloseSubscription: Subscription | null = null;
	private themeChangeSubscription: Subscription;
	isMenuOpened = false;
	timeoutMenuHide?: NodeJS.Timeout;
	isBeforeInputEventHandlerWasCreated = false;

	constructor(
		menuType: MenuWindowType,
		menuWidth: number,
		menuHeight: number,
		shouldSubscribeToMenuClose: boolean
	) {
		this.menuType = menuType;
		this.menuWidth = menuWidth;
		this.menuHeight = menuHeight;
		this.shouldSubscribeToMenuClose = shouldSubscribeToMenuClose;
		this.menuUrl = path.join(app.getAppPath(), 'app/menu', 'index.html');
		this.windowRef = new BrowserWindow({
			height: this.menuHeight,
			width: this.menuWidth,
			frame: false,
			fullscreenable: isWin32(),
			maximizable: false,
			minimizable: false,
			resizable: false,
			closable: false,
			modal: isDarwin(),
			show: false,
			transparent: true,
			hasShadow: false,
			webPreferences: {
				devTools: mainService().isDebugMode(),
				nodeIntegration: true,
				contextIsolation: false,
				preload: FileSystemProvider.makeAppRootPath('preload/menu-handler-preload.js'),
			},
		});

		this.windowRef.on('blur', () => {
			loggerService().debug('MenuWindow: event blur');
			this.hide();

			if (this.shouldSubscribeToMenuClose && this.menuCloseSubscription) {
				this.unsubscribeFromMenuClose();
			}
		});

		this.windowRef.on('closed', () => {
			loggerService().debug('MenuWindow: event closed');
			this.dispose();
		});

		this.themeChangeSubscription = themeManager().themeChange.subscribe(() => {
			if (this.windowRef.isDestroyed()) {
				loggerService().error('MenuWindow.applyWindowTheme(): calling applyTheme on window that was destroyed');
				this.dispose();
				return;
			}

			themeManager().applyTheme(this.windowRef.webContents);
		});
		this.appEventServiceSubscription = appEventService().shutdown.subscribe(() => this.dispose());

		ipcMain.on(HIDE_MENU, ({ sender: { id } }): void => {
			if (this.windowRef.isDestroyed()) {
				return;
			}

			if (this.windowRef.webContents.id === id) {
				this.unsubscribeFromMenuClose();
				this.windowRef.hide();
			}
		});
	}

	private subscribeToMenuClose(wnd: TabbedWindowBase): void {
		this.menuCloseSubscription = wnd.menuCloseEvent.subscribe(() => {
			this.hide();
		});
	}

	@logCall
	private unsubscribeFromMenuClose(): void {
		this.menuCloseSubscription?.unsubscribe();
		this.menuCloseSubscription = null;
	}

	@logCall
	async loadMenu(menuData: MenuData): Promise<void> {
		const loadOptions = {
			query: { rendererInitialData: JSON.stringify(menuData) },
		};
		if (!this.isLoading) {
			this.isLoading = true;
			try {
				await this.windowRef.loadFile(this.menuUrl, loadOptions);
			}
			catch (error) {
				loggerService().error('[MenuWindow().loadMenu()]: loadFile error', error);
			}
			finally {
				this.isLoading = false;
			}
		}
	}

	setInputEvents(wnd: BrowserWindow): void {
		if (!this.isBeforeInputEventHandlerWasCreated) {
			this.windowRef.webContents.on('before-input-event', (ev: Event, input: Input) => {
				if (input.key === 'Escape' && this.isMenuOpened) {
					this.hide();
				}
				this.acceptInput(ev, input);
			});
			this.isBeforeInputEventHandlerWasCreated = true;
		}

		const currentWindow = windowService().findWindow({ refWindow: wnd });

		if (currentWindow) {
			this.inputProcessor = new InputProcessor(currentWindow);
		}
	}

	@logCall
	attachToWindow(wnd: BrowserWindow): void {
		if (this.windowRef.isDestroyed() || wnd.isDestroyed()) {
			return;
		}
		this.windowRef.setParentWindow(wnd);
	}

	@logCall
	detachFromWindow(): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}
		this.windowRef.setParentWindow(null);
	}

	@logCall
	show(wnd: TabbedWindowBase, position: Position): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}

		if (this.menuType === MenuWindowType.MainMenu) {
			mainMenuService().setMenuOpened(true);
		}
		this.isMenuOpened = true;

		if (this.shouldSubscribeToMenuClose) {
			if (!this.menuCloseSubscription) {
				this.subscribeToMenuClose(wnd);
			}
			else {
				this.unsubscribeFromMenuClose();
				this.subscribeToMenuClose(wnd);
			}
		}

		// only on macOs - if set the position of the window before showing, then the window will automatically move to the screen borders
		if (isDarwin()) {
			this.windowRef.show();
		}
		this.windowRef.setBounds({ x: position.x, y: position.y, width: this.menuWidth, height: this.menuHeight }, false);
		this.windowRef.moveAbove(wnd.windowRef.getMediaSourceId());
		// only on Linux - if set the position of the window after showing,
		// the old position of the window will be shown first and then the window will move to the desired position
		if (isWin32()) {
			const windowState = wnd.getWindowState();
			if (windowState === WindowState.FullscreenWithPanel || windowState === WindowState.Fullscreen) {
				this.windowRef.setFullScreen(true);
			}
		}

		if (!isDarwin()) {
			this.windowRef.show();
		}
	}

	acceptInput(ev: Event, input: Input): void {
		this.inputProcessor?.injectInput(ev, input);
	}

	@logCall
	hide(isNoFocusParent?: boolean): void {
		if (this.isDestroyed()) {
			return;
		}

		const parentWnd = this.windowRef.getParentWindow();
		if (!isNoFocusParent && isWin32() && parentWnd && !parentWnd.isDestroyed()) {
			parentWnd.moveTop();
			parentWnd.focus();
		}

		if (this.windowRef.isDestroyed() || !this.windowRef.isVisible()) {
			return;
		}

		if (this.menuType === MenuWindowType.MainMenu) {
			mainMenuService().setMenuOpened(false);
		}
		this.unsubscribeFromMenuClose();

		this.windowRef.webContents.insertCSS('body { visibility: hidden; }')
			.catch((error) => {
				loggerService().error('MenuWindow.hide(): view.webContents.insertCSS() error', error);
			});
		this.windowRef.webContents.executeJavaScript('window.hideMenu()')
			.catch((error) => {
				loggerService().error('MenuWindow.hide(): view.webContents.insertCSS() error', error);
			});
	}

	getWin32PositionCorrection(wndBounds: Electron.Rectangle, wnd: TabbedWindowBase): Position {
		if (wnd.getWindowState() === WindowState.Maximized && isWin32()) {
			const display = screen.getDisplayMatching(wndBounds);
			const scaleCorrectionX = Math.round((wndBounds.width - display.workAreaSize.width) / 2);
			const scaleCorrectionY = Math.round((wndBounds.height - display.workAreaSize.height) / 2);
			return { x: scaleCorrectionX, y: scaleCorrectionY };
		}
		return { x: 0, y: 0 };
	}

	isDestroyed(): boolean {
		return this.windowRef.isDestroyed();
	}

	isLoaded(): boolean {
		return Boolean(this.windowRef.webContents.getURL());
	}

	isInputEvents(): boolean {
		return Boolean(this.inputProcessor);
	}

	@logCall
	dispose(): void {
		this.appEventServiceSubscription.unsubscribe();
		this.themeChangeSubscription.unsubscribe();
		this.unsubscribeFromMenuClose();
		if (!this.windowRef.isDestroyed()) {
			this.windowRef.webContents.removeAllListeners();
			this.windowRef.destroy();
			ipcMain.removeAllListeners();
		}
	}
}
