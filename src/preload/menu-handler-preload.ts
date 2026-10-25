import { ipcRenderer } from 'electron';
import '@sentry/electron/preload';

import { HIDE_MENU } from '../tv-api/tvd-channels';

declare global {
	interface Window {
		hideMenu(): void;
	}
}

const hideMenu = (): void => {
	document.body.classList.add('invisible-root');
	window.requestAnimationFrame(() => window.requestAnimationFrame(() => ipcRenderer.send(HIDE_MENU)));
};

window.hideMenu = hideMenu;
