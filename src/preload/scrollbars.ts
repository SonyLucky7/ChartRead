import { ipcRenderer } from 'electron';
import '@sentry/electron/preload';

import { THEME_UPDATE } from '../tv-api/tvd-channels';
import { isDarwin } from '../utils/platform';
import { StyleManager } from './style-manager';

const darkColors = `
	* {
		--scrollbar-thumb-default: #50535E;
		--scrollbar-thumb-hover: #868993;
		--scrollbar-thumb-active: #A3A6AF;
		--scrollbar-track: #131722;
		--scrollbar-track-border: #2A2E39;
	}

`;

const lightColors = `
	* {
		--scrollbar-thumb-default: #D1D4DC;
		--scrollbar-thumb-hover: #B2B5BE;
		--scrollbar-thumb-active: #9598A1;
		--scrollbar-track: #FFFFFF;
		--scrollbar-track-border: #E0E3EB;
	}

`;

const rules = `
	::-webkit-scrollbar {
		width: 9px;
		height: 9px;
	}

	::-webkit-scrollbar-thumb {
		box-sizing: border-box;
		border: 2px solid transparent;
		box-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-default);
		border-radius: 8px;
		background-color: unset;
	}

	::-webkit-scrollbar-thumb:hover {
		box-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-hover);
	}

	::-webkit-scrollbar-thumb:active {
		box-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-active);
	}

	::-webkit-scrollbar-track {
		border-radius: unset;
		padding: 2px;
		background-color: var(--scrollbar-track);
	}

	::-webkit-scrollbar-track:vertical {
		border-left: 1px solid var(--scrollbar-track-border);
	}

	::-webkit-scrollbar-track:horizontal {
		border-top: 1px solid var(--scrollbar-track-border);
	}

	::-webkit-scrollbar-corner {
		display: none;
	}
`;

export function styleScrollbars(getTheme: () => Promise<string>, toAllPlatforms: boolean): void {
	if (!toAllPlatforms && isDarwin()) {
		return;
	}

	const styleManager = new StyleManager('scrollbarTheme');

	const setScrollbars = (theme: string): void => {
		const colors = theme === 'light' ? lightColors : darkColors;

		styleManager.applyRules(colors + rules);
	};

	window.addEventListener('load', () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (window._setTheme) {
			const listener = (ev: StorageEvent): void => {
				if (ev.key === 'theme' && ev.newValue) {
					setScrollbars(ev.newValue);
				}
			};

			window.addEventListener('storage', listener);
			window.addEventListener('unload', () => {
				window.removeEventListener('storage', listener);
			});
		}
	});

	getTheme()
		.then(theme => {
			setScrollbars(theme);
		})
		.catch((err) => console.log(err));

	ipcRenderer.on(THEME_UPDATE, (ev, theme) => {
		if (typeof theme !== 'string') {
			return;
		}

		setScrollbars(theme);
	});
}
