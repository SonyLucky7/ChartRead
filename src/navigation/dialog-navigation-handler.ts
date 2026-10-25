import { HandlerDetails } from 'electron';

import { loggerService } from '../logger';
import { windowService } from '../services/window';
import { DialogWindow } from '../services/window/dialog-window';
import { isLocalURI } from '../utils/uri';
import { BaseNavigationHandler, NewWindowHandlerResponse } from './navigation-handler';
import { getDialogNavigationAction, NavigationAction } from './navigation-rules';

export class DialogNavigationHandler extends BaseNavigationHandler {
	constructor(private dialog: DialogWindow) {
		super(dialog.windowRef.webContents);
	}

	protected handleWillNavigate(ev: Event, targetUrl: string): void {
		ev.preventDefault();

		const window = windowService().getLastFocusedWindow();

		if (!window) {
			return;
		}

		const decodedUrl = decodeURI(targetUrl);
		const howToNavigate = getDialogNavigationAction(decodedUrl);

		switch (howToNavigate) {
			case NavigationAction.Inplace:
			case NavigationAction.OpenTab:
			case NavigationAction.OpenPopup: {
				this.navigateToNewTab(window, decodedUrl, 'foreground-tab').catch(err => {
					loggerService().error('Error occured during navigation in dialog', err);
				});

				this.dialog.close();
				break;
			}

			case NavigationAction.OpenExternal: {
				this.navigateExternal(decodedUrl);
				break;
			}

			case NavigationAction.Prevent: {
				break;
			}
		}
	}

	protected handleNewWindow({ url }: HandlerDetails): NewWindowHandlerResponse {
		const window = windowService().getLastFocusedWindow();

		if (!isLocalURI(url)) {
			this.navigateExternal(url);
		}
		else if (window) {
			this.navigateToNewTab(window, url).catch((err) => { loggerService().error('Error occured during navigation in dialog', err); });
		}

		return { action: 'deny' };
	}

	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	protected handleNavigation(targetUrl: string, responseCode: number): void { }
}
