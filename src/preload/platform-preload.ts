import { contextBridge } from 'electron';
import '@sentry/electron/preload';

import { styleScrollbars } from './scrollbars';
import { optimizeDesktopSpace } from './space-optimization';
import { tvdObj } from './TVD';

styleScrollbars(tvdObj.getTheme, false);
optimizeDesktopSpace();

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('TVD', tvdObj);
	}
	catch (error) {
		console.error('Failed to expose API:', error);
	}
}
