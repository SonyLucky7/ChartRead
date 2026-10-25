import { app, BrowserViewConstructorOptions, BrowserWindowConstructorOptions, screen } from 'electron';
import { existsSync } from 'fs';
import { join as pathJoin } from 'path';

import { loggerService } from '../../logger';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { featureService } from '../../tv-services/feature';
import { TVD_BACKGROUND_THROTTLING } from '../../tv-services/feature/ifeature-service';
import { isDarwin, isLinux } from '../../utils';
import { mainService } from '../main-service';
import { TitleBarOptions, WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH, WindowState, WindowStateBeforeFullscreen } from './window-api';

export const PLATFORM_PRELOAD = 'preload/platform-preload.js';

const DARWIN_TRAFFIC_LIGHT_POSITION = { x: 11, y: 10 };

export interface WindowOptions {
		width?: number;
		height?: number;
		x?: number;
		y?: number;
		minWidth?: number;
		minHeight?: number;
		fullscreenable?: boolean;
		show?: boolean;
		state?: WindowState;
		stateBeforeFullscreen?: WindowStateBeforeFullscreen;
		resizable?: boolean;
		closable?: boolean;
		minimizable?: boolean;
		maximizable?: boolean;
		acceptFirstMouse?: boolean;
}

export type WindowOptionsBounds = Required<Pick<WindowOptions, 'x' | 'y' | 'width' | 'height'>>;

export interface TabbedWindowOptions {
	windowOptions?: WindowOptions;
	titleBarOptions?: TitleBarOptions;
}

export function getWindowIconPath(): string | undefined {
	const wndIconPath = pathJoin(app.getAppPath(), 'resources', 'icons', 'logo.png');
	if (existsSync(wndIconPath)) {
		return wndIconPath;
	}

	loggerService().warn(`Window title icon (${ wndIconPath }) does not exists`);
}

export function makeBrowserWindowOptions(opts: TabbedWindowOptions): BrowserWindowConstructorOptions {
	const options: BrowserWindowConstructorOptions = {
		width: WINDOW_DEFAULT_WIDTH,
		height: WINDOW_DEFAULT_HEIGHT,
		closable: true,
		frame: false,
		titleBarStyle: 'hidden',
		trafficLightPosition: DARWIN_TRAFFIC_LIGHT_POSITION,
		acceptFirstMouse: isDarwin(),
	};

	if (opts.windowOptions) {
		Object.assign(options, opts.windowOptions);
	}

	options.show = false;

	if (isLinux() && !options.icon) { // for other OSes icon automatically loaded from application binary.
		options.icon = getWindowIconPath();
	}

	// if (typeof options.show === 'undefined' && opts.windowOptions && typeof opts.windowOptions.state !== 'undefined') {
	// 	if (isWin32()) {
	// 		options.show = opts.windowOptions.state !== WindowState.Maximized;
	// 	}
	// }

	options.webPreferences = {
		devTools: mainService().isDebugMode(),
	};

	// if (opts.windowOptions?.webPreferences) {
	// 	Object.assign(options.webPreferences, opts.windowOptions.webPreferences);
	// }

	options.webPreferences.nodeIntegration = true;
	options.webPreferences.contextIsolation = false;
	options.webPreferences.sandbox = false;
	// if affinity is used, accessing window.opener will cause Cross-Origin request failure exception.
	// don't known how to fixit (webSecurity = false is not working for this case, and that in itself is a bad idea)

	// check that window is visible on screen. If it is not - then default values for position will be used.
	if (typeof options.x !== 'undefined' && typeof options.y !== 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const windowPos: Electron.Rectangle = { x: options.x, y: options.y, width: options.width!, height: options.height! };
		const display = screen.getDisplayNearestPoint(windowPos);

		if (!isOnScreen(windowPos, display)) {
			delete options.x;
			delete options.y;
		}
	}

	return options;
}

export function makeBrowserViewOptions(forLocalFile: boolean, customPreload: string | null = null): BrowserViewConstructorOptions {
	const options: BrowserViewConstructorOptions = {};

	options.webPreferences = {
		preload: FileSystemProvider.makeAppRootPath(customPreload ?? PLATFORM_PRELOAD),
		devTools: true,
	};

	const isBackgroundThrottlingEnabled = featureService().isFeatureEnabled(TVD_BACKGROUND_THROTTLING, false);

	if (!isDarwin() && !isBackgroundThrottlingEnabled) {
		options.webPreferences.backgroundThrottling = false;
	}

	options.webPreferences.nodeIntegration = forLocalFile;
	options.webPreferences.contextIsolation = !forLocalFile;
	options.webPreferences.sandbox = !forLocalFile;

	return options;
}

function isOnScreen(rect: Electron.Rectangle, display: Electron.Display): boolean {
	const area = display.workArea;
	if (area.x + area.width < rect.x || area.y + area.height < rect.y) {
		return false;
	}

	if (rect.x + rect.width < area.x || rect.y + rect.height < area.y) {
		return false;
	}

	return true;
}
