import { Rectangle, screen } from 'electron';

import { loggerService } from '../../logger';
import { ContentSize, WindowPreferences } from '../../navigation/window-navigation-preferences';
import { PersistentConstructor } from '../../persistence';
import { confineBounds } from '../../utils';
import { getConfiguration } from '../configuration';
import { TabbedWindowBase } from './tabbed-window';
import { Fullscreenable } from './window-features/fullscreenable';
import { WindowMixin } from './window-features/window-mixin';
import { WithKeyBindings } from './window-features/with-key-bindings';
import { WithMenu } from './window-features/with-menu';
import { WithTooltips } from './window-features/with-tooltips';
import { TabbedWindowOptions, WindowOptions, WindowOptionsBounds } from './window-options';

/**
 * Defines final mixin with decorators
 **/

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/naming-convention
function PersistenceServiceWindow<T extends WindowMixin<TabbedWindowBase>>(Base: T) {
	@PersistentConstructor('options')
	class PersistenceServiceWin extends Base {
		constructor(...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);
		}
	}

	return PersistenceServiceWin;
}

// apply mixins
// Persistence mixin should be applied last
// eslint-disable-next-line @typescript-eslint/naming-convention
const ExtendedTabbedWindow =
	PersistenceServiceWindow(
		WithTooltips(
			Fullscreenable(
				WithMenu(
					WithKeyBindings(TabbedWindowBase)
				)
			)
		)
	);

// defines result type and constructor
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TabbedWindow = ExtendedTabbedWindow;
export type TabbedWindow = InstanceType<typeof ExtendedTabbedWindow>;

export function getDefaultTabbedWindowOptions(): Required<TabbedWindowOptions> {
	const wndConfig = getConfiguration().windows;

	return {
		windowOptions: {
			width: wndConfig.chartInitialWidth,
			height: wndConfig.chartInitialHeight,
			minWidth: wndConfig.chartMinWidth,
			minHeight: wndConfig.chartMinHeight,
		},
		titleBarOptions: {
			showMainMenu: true,
			showTabs: true,
			showMaximize: true,
			showMinimize: true,
		},
	};
}

export function createEmptyWindow(options?: TabbedWindowOptions, windowPreferences?: WindowPreferences, cascadePosition?: Rectangle): TabbedWindow {
	if (windowPreferences != null) {
		return createConfinedEmptyWindow(windowPreferences, options, cascadePosition);
	}

	return createDefaultEmptyWindow(options, cascadePosition);
}

function createDefaultEmptyWindow(options?: TabbedWindowOptions, cascadePosition?: WindowOptionsBounds): TabbedWindow {
	loggerService().debug('Will create default empty window');

	const compositeOptions = getDefaultTabbedWindowOptions();
	if (options?.windowOptions != null) {
		compositeOptions.windowOptions = Object.assign(compositeOptions.windowOptions, options.windowOptions);
	}
	else if (cascadePosition != null) {
		compositeOptions.windowOptions = Object.assign(compositeOptions.windowOptions, cascadePosition);
	}

	if (options?.titleBarOptions != null) {
		compositeOptions.titleBarOptions = Object.assign(compositeOptions.titleBarOptions, options.titleBarOptions);
	}

	return new TabbedWindow(compositeOptions);
}

function createConfinedEmptyWindow(
	windowPreferences?: WindowPreferences,
	options?: TabbedWindowOptions,
	cascadePosition?: Rectangle): TabbedWindow {
	loggerService().debug('Will create confined empty window');

	const confinedWindowOptions = createConfinedWindowOptions(options?.windowOptions, windowPreferences, cascadePosition);

	const defaultOptions = getDefaultTabbedWindowOptions();

	defaultOptions.windowOptions = Object.assign(defaultOptions.windowOptions ?? {}, confinedWindowOptions);
	if (options?.titleBarOptions) {
		defaultOptions.titleBarOptions = Object.assign(defaultOptions.titleBarOptions ?? {}, options.titleBarOptions);
	}

	return new TabbedWindow(defaultOptions);
}

function createConfinedWindowOptions(
	windowOptions?: WindowOptions,
	windowPreferences?: WindowPreferences,
	cascadePosition?: Rectangle): WindowOptions {
	// initial size
	const wndConfig = getConfiguration().windows;
	let width = wndConfig.chartInitialWidth;
	let height = wndConfig.chartInitialHeight;

	if (windowPreferences?.contentSize !== undefined) {
		[width, height] = windowSizeFromContentSize(windowPreferences.contentSize, TabbedWindow.defaultContentViewFrameOffset());
	}
	else if (windowOptions?.height && windowOptions?.width) {
		width = windowOptions?.width;
		height = windowOptions?.height;
	}

	// initial screen
	const currentScreenWorkArea = cascadePosition
		? screen.getDisplayMatching(cascadePosition).workArea
		: screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;

	let targetScreenWorkArea = currentScreenWorkArea;

	// initial position
	const position = {
		x: windowOptions?.x ?? currentScreenWorkArea.x,
		y: windowOptions?.y ?? currentScreenWorkArea.y,
	};

	if (windowPreferences?.left || windowPreferences?.top) {
		// its allowed to move by only one coordinate.
		// but in that case we 1) discard cascadePositon (move from screen bounds)
		// 2) mixin position from existing windowOptions for the axis not provided in desired pos.
		position.x = windowPreferences.left ?? position.x;
		position.y = windowPreferences.top ?? position.y;
		// since we had custom position input we recalculate working area
		targetScreenWorkArea = screen.getDisplayMatching({ ...position, width, height }).workArea;
	}
	else if (cascadePosition) {
		position.x = cascadePosition.x;
		position.y = cascadePosition.y;
	}

	// finally fix bounds to screen
	const confinedBounds = confineBounds({ ...position, width, height }, wndConfig.chartMinWidth, wndConfig.chartMinHeight, targetScreenWorkArea);

	return Object.assign(windowOptions ?? {}, confinedBounds);
}

function windowSizeFromContentSize(desiredContentSize: ContentSize, windowFrameOffset: Rectangle): [number, number] {
	const width = desiredContentSize.width + windowFrameOffset.width;
	const height = desiredContentSize.height + windowFrameOffset.height;

	return [width, height];
}
