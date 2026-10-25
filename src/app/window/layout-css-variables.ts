import { DARWIN_CONTROLS_WIDTH } from '../../services/interfaces';
import { CREATE_NEW_TAB_BUTTON_WIDTH, WINDOW_HEADER_HEIGHT } from '../../services/window/window-api';

/**
 * exposes layout sizes shared between the window chrome markup and the main process to css,
 * so that every size is declared once, in ts
 */
export function applyLayoutCssVariables(): void {
	const layoutVariableMap = new Map<string, number>([
		['--window-header-height', WINDOW_HEADER_HEIGHT],
		['--darwin-controls-width', DARWIN_CONTROLS_WIDTH],
		['--create-new-tab-button-width', CREATE_NEW_TAB_BUTTON_WIDTH],
	]);

	for (const [name, value] of layoutVariableMap) {
		document.documentElement.style.setProperty(name, `${ value }px`);
	}
}
