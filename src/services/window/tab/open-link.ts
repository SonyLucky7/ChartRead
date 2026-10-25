import { BrowserWindow } from 'electron';

import { loggerService } from '../../../logger';
import { getNavigationAction, NavigationAction } from '../../../navigation/navigation-rules';
import { windowService } from '..';

/**
 * @returns boolean value indicating whether opening went successfully
 */
export function openLink(url: string, wnd?: BrowserWindow): boolean {
	const tabbedWindow = windowService().findWindow({ refWindow: wnd }) ?? windowService().getLastFocusedWindow();
	if (!tabbedWindow) {
		return false;
	}

	if (
		getNavigationAction(url) === NavigationAction.Inplace ||
		getNavigationAction(url) === NavigationAction.OpenTab
	) {
		tabbedWindow.createAndAddTab({ url })
			.catch((error) => { loggerService().error('tabbedWindow.addTab() error in openLink()', error); });
		return true;
	}

	return false;
}
