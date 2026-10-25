import { BrowserWindow, BrowserWindowConstructorOptions, Event, HandlerDetails, screen, shell, WebContents } from 'electron';

import { assert, assertNotNull } from '../assertion';
import { loggerService } from '../logger';
import { shortifyUrl } from '../logger/log-formatter';
import { FileSystemProvider } from '../providers/file-system-provider';
import { getConfiguration } from '../services/configuration';
import { ChatPopupWindow, makeDefaultConstructorOptions, PopupWindow } from '../services/window/popup-window';
import { ITabbedWindowControl } from '../services/window/window-api';
import { PLATFORM_PRELOAD } from '../services/window/window-options';
import { centeredRect, confineBounds, ignorePromise, isDarwin, isDetachedChatUrl, isLocalURI, isPdfViewerURI, isWin32 } from '../utils';
import { getNavigationAction, NavigationAction } from './navigation-rules';
import { WindowPreferences } from './window-navigation-preferences';

type NewWindowHandler = Parameters<Pick<WebContents, 'setWindowOpenHandler'>['setWindowOpenHandler']>[0];
export type NewWindowHandlerResponse = ReturnType<NewWindowHandler>;

export abstract class BaseNavigationHandler {
	constructor(protected webContents: WebContents) {
		assertNotNull(this.webContents);
		assert(!this.webContents.isDestroyed(), 'webContents is destroyed!');

		this.webContents.setWindowOpenHandler((details): NewWindowHandlerResponse => this.handleNewWindow(details));

		this.webContents.addListener('did-create-window', (wnd, details) => {
			this.navigatedToPopup(wnd, details.url);
		});

		this.webContents.addListener('will-navigate', (ev: Event, targetUrl: string) => {
			this.handleWillNavigate(ev, targetUrl);
		});

		this.webContents.addListener('did-start-navigation', (ev, targetUrl) => {
			const currentUrl = this.webContents?.getURL();
			this.handleStartNavigation(targetUrl, currentUrl);
		});

		this.webContents.addListener('did-navigate', (ev: Event, targetUrl: string, responseCode: number) => {
			this.handleNavigation(targetUrl, responseCode);
		});
	}

	protected async navigateToNewTab(wnd: ITabbedWindowControl, url: string, disposition?: string, title?: string): Promise<string> {
		loggerService().info(`Navigate to new tab -> ${ shortifyUrl(url) }`);

		const active = disposition === 'foreground-tab';

		return wnd.createAndAddTab({
			url,
			title,
			active,
		});
	}

	protected navigateExternal(url: string): void {
		loggerService().info(`Navigate external -> ${ shortifyUrl(url) }`);
		ignorePromise(shell.openExternal(url));
	}

	protected navigatedToPopup(wnd: BrowserWindow, url: string): PopupWindow {
		loggerService().info(`Navigate to popup -> ${ shortifyUrl(url) }`);
		const isChat = isDetachedChatUrl(url);

		return isChat
			? new ChatPopupWindow(url, wnd)
			: new PopupWindow(url, wnd);
	}

	protected getDefaultBrowserWindowConstructorOptions(url: string, parentWnd: BrowserWindow, windowPreferences?: WindowPreferences): BrowserWindowConstructorOptions {
		let defaultOptions = makeDefaultConstructorOptions();
		if (windowPreferences?.contentSize != null) {
			defaultOptions.width = windowPreferences.contentSize.width;
			defaultOptions.height = windowPreferences.contentSize.height;
		}

		if (defaultOptions.width && defaultOptions.height) {
			const rect = centeredRect(parentWnd.getBounds(), defaultOptions.width, defaultOptions.height);
			defaultOptions.x = windowPreferences?.left ?? rect.x;
			defaultOptions.y = windowPreferences?.top ?? rect.y;

			const wndConfig = getConfiguration().windows;
			const confinedBounds = confineBounds({ x: defaultOptions.x, y: defaultOptions.y, width: defaultOptions.width, height: defaultOptions.height },
				wndConfig.splash.width, wndConfig.splash.height, screen.getDisplayMatching(parentWnd.getBounds()).workArea
			);

			defaultOptions = Object.assign(defaultOptions, confinedBounds);
		}

		if (defaultOptions.webPreferences) {
			defaultOptions.webPreferences.preload = FileSystemProvider.makeAppRootPath(PLATFORM_PRELOAD);
		}

		defaultOptions.modal = isWin32() && isDetachedChatUrl(url);
		defaultOptions.show = !isDarwin();
		defaultOptions.fullscreenable = !isDarwin();
		defaultOptions.minimizable = !isDarwin();

		return defaultOptions;
	}

	protected handleStartNavigation(targetUrl: string, currentUrl?: string): void {
		assertNotNull(this.webContents);
		assert(!this.webContents.isDestroyed(), 'webContents is destroyed!');

		if (isLocalURI(targetUrl) || isPdfViewerURI(targetUrl)) {
			return;
		}

		// the last resort
		// will-navigate does not catch navigation in iframes, nothing does, so stopping the navigation is the only way
		// refer to this issue for navigation event on iframe https://github.com/electron/electron/issues/7097
		if (getNavigationAction(targetUrl, currentUrl) === NavigationAction.Prevent) {
			loggerService().warn(`Navigation to ${ shortifyUrl(targetUrl) } will be prevented`);

			// `webContents.stop()` crashes the app unless it is called outside of chromium's
			// navigation stack, which `did-start-navigation` is emitted from synchronously
			setImmediate(() => {
				if (!this.webContents.isDestroyed()) {
					this.webContents.stop();
				}
			});
		}
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */
	protected abstract handleWillNavigate(ev: Event, targetUrl: string): void;
	protected abstract handleNavigation(targetUrl: string, responseCode: number): void;
	protected abstract handleNewWindow(details: HandlerDetails): NewWindowHandlerResponse;
	/* eslint-enable @typescript-eslint/no-unused-vars */
}
