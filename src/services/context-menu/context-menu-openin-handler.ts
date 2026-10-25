import { shell } from 'electron';

import { loggerService } from '../../logger';
import { shortifyUrl } from '../../logger/log-formatter';
import { openExternalIgnoringAppLinking } from '../../native';
import { getNavigationAction, NavigationAction } from '../../navigation/navigation-rules';
import { isChartUrl, isSupportUrl, isWin32 } from '../../utils';
import { localeService } from '../locale';
import { windowService } from '../window';
import { TabbedWindow } from '../window/tabbed-window-imports';
import { OpenInAction } from '.';

export class ContextMenuOpenInHandler {
	handleOpenIn(action: OpenInAction, url: string, wnd?: TabbedWindow, title?: string): void {
		const targetUrl = decodeURI(url);

		const howToNavigate = getNavigationAction(targetUrl);

		if (howToNavigate === NavigationAction.Prevent) {
			return;
		}

		if (howToNavigate === NavigationAction.OpenExternal || action === OpenInAction.Browser) {
			const isChartOrSupportUrl = isChartUrl(targetUrl) || isSupportUrl(targetUrl);

			const urlToOpen = isChartOrSupportUrl ? localeService().localeAwareUrl(targetUrl) : targetUrl;
			const openExternalPromise = isWin32() ? openExternalIgnoringAppLinking(urlToOpen) : shell.openExternal(urlToOpen);

			openExternalPromise.catch(error => {
				loggerService().error(`ContextMenuOpenInHandler.handleOpenIn(${ howToNavigate }):`, error);
			});

			return;
		}

		if (!wnd) {
			return;
		}

		if (action === OpenInAction.NewTab) {
			return this.handleOpenInNewTab(targetUrl, wnd, title);
		}

		if (action === OpenInAction.NewWindow) {
			return this.handleOpenInNewWindow(targetUrl, wnd);
		}
	}

	private handleOpenInNewTab(url: string, wnd: TabbedWindow, title?: string): void {
		loggerService().debug(`ContextMenuOpenInHandler.handleOpenInNewTab(url: ${ shortifyUrl(url) })`);

		wnd.createAndAddTab({ url, title, active: false })
			.catch((err) => loggerService().error('ContextMenuOpenInHandler.navigateToNewTab: ', err));
	}

	private handleOpenInNewWindow(url: string, wnd: TabbedWindow): void {
		windowService().newWindow({ sourceWindow: wnd.windowRef, url });
	}
}
