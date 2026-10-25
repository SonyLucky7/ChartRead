import { BrowserWindow, BrowserWindowConstructorOptions, Event, shell, WebContents } from 'electron';

import { loggerService } from '../../logger';
import { logCallName } from '../../logger/log-decorator';
import { shortifyUrl } from '../../logger/log-formatter';
import { NewWindowHandlerResponse } from '../../navigation/navigation-handler';
import { getNavigationAction, getPopupNavigationAction, NavigationAction, PopupNavigationEvent } from '../../navigation/navigation-rules';
import {
	ignorePromise,
	InputProcessor,
	isDetachedChatUrl,
	isTVHostedUrl,
	isWin32,
} from '../../utils';
import { bindHotkeyCommand } from '../../utils/hotkey-service';
import { mainService } from '../main-service';
import { passwordManagerService } from '../password-manager';
import { credentialHelper } from '../password-manager/credential-helper';
import { settingsProvider } from '../settings';
import { WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH } from './window-api';

export interface ExperimentalBrowserWindowConstructorOptions extends BrowserWindowConstructorOptions {
	webContents?: WebContents;
}

export function makeDefaultConstructorOptions(opts?: { title?: string; }): ExperimentalBrowserWindowConstructorOptions {
	const constructorOpts: BrowserWindowConstructorOptions = {
		show: true,
		minimizable: false,
		fullscreenable: false,
		width: WINDOW_DEFAULT_WIDTH,
		height: WINDOW_DEFAULT_HEIGHT,
		title: opts?.title,
		closable: true,

		webPreferences: {
			devTools: mainService().isDebugMode(),
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: true,
			sandbox: true,
			plugins: true,
		},
	};

	return constructorOpts;
}

const disabledCredentialsInsertUrls = [
	'https://www.oanda.com/',
];

@logCallName('PopupWindow')
export class PopupWindow {
	private readonly inputProcessor = new InputProcessor(this);

	readonly windowRef: BrowserWindow;

	constructor(url: string, wnd: BrowserWindow) {
		loggerService().info(`PopupWindow: Will create popup window for url:(${ url })`);

		this.windowRef = wnd;

		this.windowRef.setMenu(null);

		this.windowRef.webContents.setWindowOpenHandler(({ url: targetUrl }): NewWindowHandlerResponse => {
			const navigationAction = getPopupNavigationAction(
				targetUrl,
				PopupNavigationEvent.WillCreateWindow,
				this.windowRef.webContents.getURL()
			);

			if (navigationAction === NavigationAction.OpenPopup) {
				return { action: 'allow' };
			}

			if (navigationAction === NavigationAction.OpenExternal) {
				shell.openExternal(targetUrl)
					.catch((error) => {
						loggerService().error(
							`PopupWindow.webContents.setWindowOpenHandler: shell.openExternal(url: ${ targetUrl })`,
							error
						);
					});
			}

			return { action: 'deny' };
		});

		// For Facebook Post without this, dialog window will never able to be closed.
		this.windowRef.webContents.addListener('will-prevent-unload', (ev: Event) => {
			ev.preventDefault();
		});

		this.windowRef.webContents.addListener('will-navigate', (ev) => {
			const navigationAction = getPopupNavigationAction(
				ev.url,
				PopupNavigationEvent.WillNavigate,
			);

			if (navigationAction === NavigationAction.Prevent) {
				ev.preventDefault();
			}

			if (navigationAction === NavigationAction.OpenExternal) {
				ev.preventDefault();

				shell.openExternal(ev.url)
					.catch((error) => {
						loggerService().error(
							`PopupWindow.webContents.will-navigate: shell.openExternal(url: ${ ev.url })`,
							error
						);
					});
			}
		});

		this.windowRef.webContents.addListener('did-finish-load', () => {
			if (
				isTVHostedUrl(url) &&
				passwordManagerService().canUseStorageByService() &&
				this.isAllowedCredentialsInsert()
			) {
				this.windowRef.webContents.executeJavaScript(`
					(${ credentialHelper.toString() })(${ true });`
				)
					.catch((error) => loggerService().error('credentialHelper execute error', error));
			}
		});

		this.windowRef.webContents.addListener('page-title-updated', () => {
			const newTitle = this.windowRef.webContents.getTitle();
			this.windowRef.setTitle(newTitle);
		});

		this.windowRef.webContents.addListener('before-input-event', (ev: Event, input: Electron.Input) => {
			this.inputProcessor.injectInput(ev, input);
			if (!ev.defaultPrevented) {
				this.windowRef.focus();
			}
		});

		this.windowRef.webContents.addListener('did-create-window', (window) => {
			window.webContents.setWindowOpenHandler(({ url: targetUrl }): NewWindowHandlerResponse => {
				const navigationAction = getPopupNavigationAction(
					targetUrl,
					PopupNavigationEvent.DidCreateWindow
				);

				if (navigationAction === NavigationAction.OpenExternal) {
					shell.openExternal(targetUrl)
						.catch((error) => {
							loggerService().error(
								`PopupWindow.webContents.will-navigate: shell.openExternal(url: ${ targetUrl })`,
								error
							);
						});
				}

				return { action: 'deny' };
			});

			// TODO: add the same navigation processing for child electron window: TVD-2460
			// window.webContents.addListener('will-navigate', () => {});
		});

		this.handlePopupNavigation();

		this.windowRef.show();
	}

	protected handlePopupNavigation(): void {}

	@bindHotkeyCommand('show-settings')
	private showSettings(): void {
		settingsProvider().showSettings();
	}

	@bindHotkeyCommand('set-full-screen', { pred: () => { return isWin32(); } })
	private setFullScreen(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling setFullScreen on popup window that was destroyed');
			return;
		}

		if (this.windowRef.isFullScreenable()) {
			const isFullscreened = this.windowRef.isFullScreen();
			loggerService().info(`PopupWindow: ${ isFullscreened ? 'windowed' : 'fullscreened' }`);
			this.windowRef.setFullScreen(!isFullscreened);
		}
	}

	private isAllowedCredentialsInsert(): boolean {
		const url = this.windowRef.webContents.getURL();

		return !disabledCredentialsInsertUrls
			.some(u => url.startsWith(u));
	}
}

export class ChatPopupWindow extends PopupWindow {
	protected override handlePopupNavigation(): void {
		const isChatWindow = (targetUrl: string): boolean => {
			const isChat = isDetachedChatUrl(targetUrl);
			const currentUrl = this.windowRef.webContents.getURL();

			return isChat && (!currentUrl || targetUrl === currentUrl);
		};

		const openExternalIfAllowed = (url_: string, ev?: Event): void => {
			const targetUrl = decodeURI(url_);

			loggerService().debug(`ChatPopupWindow.openExternalIfAllowed(url: ${ shortifyUrl(targetUrl) })`);

			if (isChatWindow(targetUrl)) {
				return;
			}

			ev?.preventDefault();

			const howToNavigate = getNavigationAction(targetUrl);

			if (howToNavigate === NavigationAction.Prevent) {
				loggerService().debug('ChatPopupWindow.openExternalIfAllowed(): "navigation prevented"');
				return;
			}

			ignorePromise(shell.openExternal(url_));
		};

		this.windowRef.webContents.addListener('will-navigate', (ev: Event, url_: string) => {
			loggerService().debug(`ChatPopupWindow.will-navigate(url: ${ shortifyUrl(url_) })`);
			openExternalIfAllowed(url_, ev);
		});

		this.windowRef.webContents.setWindowOpenHandler(({ url }) => {
			loggerService().debug(`ChatPopupWindow.new-window(url: ${ shortifyUrl(url) })`);

			const targetUrl = decodeURI(url);

			if (isChatWindow(targetUrl)) {
				return {
					action: 'allow',
				};
			}

			openExternalIfAllowed(url);

			return {
				action: 'deny',
			};
		});
	}
}
