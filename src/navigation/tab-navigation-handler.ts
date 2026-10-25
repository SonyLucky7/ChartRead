import { HandlerDetails, shell, WebContents } from 'electron';

import { assert, assertNotNull } from '../assertion';
import { HttpResponseCode } from '../http';
import { linkingService } from '../linking';
import { loggerService } from '../logger';
import { shortifyId, shortifyUrl } from '../logger/log-formatter';
import { NewWindowInfo, windowService } from '../services/window';
import { Tab } from '../services/window/tab/tab';
import { TabbedWindow } from '../services/window/tabbed-window-imports';
import { TabbedWindowOptions } from '../services/window/window-options';
import { getPersistentUrl, ignorePromise, isLinkableUrl, isLocalURI } from '../utils';
import { BaseNavigationHandler, NewWindowHandlerResponse } from './navigation-handler';
import { getNavigationAction, getNewWindowNavigationAction, getWindowOpenAction, NavigationAction, navigationActionToString, resolveEmbeddedLink } from './navigation-rules';
import NavigationPreferences, * as windowNavigationPreferences from './window-navigation-preferences';

interface HandleActionFromNewWindowOptions {
	disposition: string;
	url: string;
	wnd: TabbedWindow;
	navigationPreferences?: NavigationPreferences;
}

const TOO_MANY_REQUESTS_RELOAD_DELAY = 150;

export class TabNavigationHandler extends BaseNavigationHandler {
	constructor(protected override webContents: WebContents, private tab: Tab) {
		super(webContents);
		assert(this.webContents.id === tab.webContentsId(), 'webContents and tabs id aren\'t equal');
	}

	protected override handleWillNavigate(ev: Event, targetUrl: string): void {
		const url = decodeURI(targetUrl);

		loggerService().info(`Tab [${ shortifyId(this.tab.id) }] will try navigate: ${ shortifyUrl(this.webContents.getURL()) } -> ${ shortifyUrl(url) }`);
		if (this.webContents.isDestroyed()) {
			ev.preventDefault();
			return;
		}

		const window = windowService().findWindow({ tabWebContents: this.webContents });

		if (!window) {
			ev.preventDefault();
			return;
		}

		const currentUrl = this.webContents.getURL();
		const howToNavigate = getNavigationAction(url, currentUrl);

		loggerService().info(`Tab [${ shortifyId(this.tab.id) }] goes navigate: ${ shortifyUrl(currentUrl) } -> ${ shortifyUrl(url) } as ${ navigationActionToString(howToNavigate) }`);

		switch (howToNavigate) {
			case NavigationAction.Inplace: {
				if (!Tab.isUlsFromSameDomains(currentUrl, url)) {
					ev.preventDefault();
					ignorePromise(this.navigateInPlace(url));
					return;
				}

				if (isLocalURI(targetUrl)) {
					const link = resolveEmbeddedLink(targetUrl);
					ev.preventDefault();
					this.tab.load(link?.path ?? targetUrl);
				}

				break;
			}

			case NavigationAction.OpenTab: {
				ev.preventDefault();
				ignorePromise(this.navigateToNewTab(window, url, 'foreground-tab'));
				break;
			}

			case NavigationAction.OpenExternal: {
				ev.preventDefault();
				this.navigateExternal(url);
				break;
			}

			case NavigationAction.OpenPopup: {
				ev.preventDefault();
				this.navigatedToPopup(window.windowRef, url);
				break;
			}

			case NavigationAction.Prevent: {
				ev.preventDefault();
				loggerService().info(`Tab [${ shortifyId(this.tab.id) }] prevents navigation: ${ shortifyUrl(currentUrl) } -> ${ shortifyUrl(url) }`);
				break;
			}
		}
	}

	protected override handleNewWindow({ url, features, disposition, referrer }: HandlerDetails): NewWindowHandlerResponse {
		loggerService().info(`Tab [${ shortifyId(this.tab.id) }] navigating: new window -> ${ shortifyUrl(url) }`);

		const wnd = windowService().findWindow({ tabWebContents: this.webContents });

		if (this.webContents.isDestroyed() || !wnd) {
			return {
				action: 'deny',
			};
		}

		const preferences = windowNavigationPreferences.getFromWindowFeatures(features);
		const handleActionFromNewWindowOptions: HandleActionFromNewWindowOptions = {
			disposition,
			url,
			wnd,
			navigationPreferences: preferences,
		};

		if (preferences.openExternal === true) {
			this.handleActionFromNewWindow(NavigationAction.OpenExternal, handleActionFromNewWindowOptions);

			return {
				action: 'deny',
			};
		}

		if (preferences.newWindow === true) {
			const navigationAction = getNewWindowNavigationAction(url, referrer.url);

			if (navigationAction === NavigationAction.OpenWindow) {
				this.handleActionFromNewWindow(NavigationAction.OpenWindow, handleActionFromNewWindowOptions);
			}

			return {
				action: 'deny',
			};
		}

		let urlWithoutQueryParams: string | undefined;

		try {
			urlWithoutQueryParams = getPersistentUrl(url);
		}
		catch (error) {
			loggerService().error(`TabNavigationHandler.handleNewWindow(): getPersistentUrl(url: ${ url })`, error);
		}

		if (!urlWithoutQueryParams) {
			return {
				action: 'deny',
			};
		}

		const windowOpenAction = getWindowOpenAction(urlWithoutQueryParams);

		if (windowOpenAction === NavigationAction.OpenPopup) {
			const decodedUrl = decodeURI(url);

			return {
				action: 'allow',
				overrideBrowserWindowOptions: this.getDefaultBrowserWindowConstructorOptions(
					decodedUrl,
					wnd.windowRef,
					preferences
				),
			};
		}
		else {
			this.handleActionFromNewWindow(windowOpenAction, handleActionFromNewWindowOptions);

			return {
				action: 'deny',
			};
		}
	}

	private handleActionFromNewWindow(
		action: NavigationAction,
		{
			disposition,
			url,
			wnd,
			navigationPreferences,
		}: HandleActionFromNewWindowOptions
	): void {
		const decodedUrl = decodeURI(url);

		loggerService().info(`Tab [${ shortifyId(this.tab.id) }] TabNavigationHandler.handleActionFromNewWindow(): action ${ navigationActionToString(action) } for ${ shortifyUrl(url) }`);

		switch (action) {
			case NavigationAction.OpenTab: {
				this.navigateToNewTab(wnd, decodedUrl, disposition, undefined)
					.then((newTabId: string) => {
						if (navigationPreferences?.link && isLinkableUrl(this.tab.url) && isLinkableUrl(decodedUrl)) {
							const success = linkingService().linkToSameGroup(this.tab.id, newTabId);
							if (!success) {
								loggerService().warn(`handleActionFromNewWindow attempt to link unlinkable tabs with ids: ${ this.tab.id }, ${ newTabId }`);
							}
						}
					})
					.catch(error => {
						loggerService().error(
							`Tab [${ shortifyId(this.tab.id) }] failed to ${ navigationActionToString(action) }`,
							error,
						);
					});

				break;
			}

			case NavigationAction.OpenWindow: {
				const tabbedWindowOptions: TabbedWindowOptions = { titleBarOptions: { showTabs: true, showMinimize: true, showMaximize: true } };

				const newWindowInfo: NewWindowInfo = { url, sourceWindow: wnd.windowRef, sourceTab: this.tab, windowPreferences: navigationPreferences };
				if (navigationPreferences?.link && isLinkableUrl(this.tab.url) && isLinkableUrl(url)) {
					newWindowInfo.linkNewTab = true;
				}
				windowService().newWindow(
					newWindowInfo,
					tabbedWindowOptions,
				);

				break;
			}

			case NavigationAction.OpenExternal: {
				shell.openExternal(url)
					.catch(error => {
						loggerService().error(
							`Tab [${ shortifyId(this.tab.id) }] failed to ${ navigationActionToString(action) }`,
							error,
						);
					});

				break;
			}

			case NavigationAction.Prevent: {
				loggerService().info(`Prevent new-window: (${ decodedUrl })`);
				break;
			}

			default: {
				loggerService().warn(`Unexpected navigation action for new-window, don't know what to do. url: (${ decodedUrl }), disposition: (${ disposition })`);
			}
		}
	}

	protected override handleNavigation(targetUrl: string, responseCode: number): void {
		if (responseCode === HttpResponseCode.OK) {
			loggerService().info(`Tab [${ shortifyId(this.tab.id) }] successfully navigated to ${ shortifyUrl(targetUrl) }`);
			return;
		}

		loggerService().debug(`Tab [${ shortifyId(this.tab.id) }] failed to navigate to ${ shortifyUrl(targetUrl) } with response code: ${ responseCode }`);
		if (responseCode === HttpResponseCode.TooManyRequests) {
			setTimeout(() => {
				loggerService().warn('Reload content, because of "Too many requests"');
				this.tab.reload().catch(err => { throw err; });
			}, TOO_MANY_REQUESTS_RELOAD_DELAY);
		}
	}

	protected async navigateInPlace(url: string): Promise<void> {
		assertNotNull(this.webContents);
		assert(!this.webContents.isDestroyed(), 'webContents is destroyed!');

		loggerService().info(`Navigate inplace [${ shortifyId(this.tab.id) }]; ${ shortifyUrl(this.webContents.getURL()) } -> ${ shortifyUrl(url) }`);

		if (await this.tab.checkCanBeUnloaded()) {
			await this.tab.load(url);
		}
	}
}
