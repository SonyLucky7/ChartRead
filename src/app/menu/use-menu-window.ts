import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { loggerServiceProxy } from '../../logger';
import { changeLanguage } from '../../services/locale';
import { mainMenuServiceProxy } from '../../services/main-menu-service';
import { MenuType } from '../../services/window/menu-window-types';
import { isDarwin } from '../../utils';
import { getRendererInitialData, getWindowControl } from '../common/app-common';
import { useOutsideClick } from '../components-ui/hooks';

interface UseMenuWindowResult<T> {
	menuRef: RefObject<HTMLDivElement>;
	anchorMenuRef: RefObject<HTMLDivElement>;
	isReady: boolean;
	isVisible: boolean;
	rendererData: T;
	close(): void;
}

// Popovers are portaled to document.body, so a per-window class on <body> lets
// CSS cap their width (see menu-window.css). Menu types without an entry keep
// the default popover width.
const MENU_WINDOW_BODY_CLASS: Partial<Record<MenuType, string>> = {
	[MenuType.Tab]: 'tab-menu-window',
	[MenuType.TabGroup]: 'tab-group-menu-window',
};

// Close behavior is part of the window lifecycle this hook owns. The tab group
// menu is its own window; the base menu window (main and tab) hides both the
// main menu service and the tab menu window.
function closeMenuWindow(type: MenuType): void {
	if (type === MenuType.TabGroup) {
		getWindowControl().hideTabGroupMenu()
			.catch((error) => {
				loggerServiceProxy().error('useMenuWindow(): getWindowControl().hideTabGroupMenu() error', error);
			});
		return;
	}

	if (type === MenuType.Main) {
		mainMenuServiceProxy().hideMenu()
			.catch((error) => {
				loggerServiceProxy().error('useMenuWindow(): mainMenuServiceProxy().hideMenu() error', error);
			});
		return;
	}

	getWindowControl().hideTabMenu()
		.catch((error) => {
			loggerServiceProxy().error('useMenuWindow(): getWindowControl().hideTabMenu() error', error);
		});
}

/**
 * Shared lifecycle for menu windows (base menu, tab group menu): reads the
 * renderer data, applies the locale, reveals the window and closes it on an
 * outside click / Escape. The concrete content and positioning stay in the
 * consuming component.
 */
export function useMenuWindow<T extends { locale: string; type: MenuType; }>(): UseMenuWindowResult<T> {
	const menuRef = useRef<HTMLDivElement>(null);
	const anchorMenuRef = useRef<HTMLDivElement>(null);

	const [isReady, setIsReady] = useState<boolean>(false);
	const [isVisible, setIsVisible] = useState<boolean>(isDarwin());
	const [rendererData] = useState<T>(() => getRendererInitialData<T>());

	useLayoutEffect(() => {
		if (isVisible) {
			return;
		}

		// On non-macOS the window is revealed after a short delay, giving it time to
		// position itself and avoiding a flash at the wrong location.
		const revealTimeoutId = setTimeout(() => {
			setIsVisible(true);
		}, 100);

		return () => {
			clearTimeout(revealTimeoutId);
		};
	}, [isVisible]);

	useEffect(() => {
		const bodyClass = MENU_WINDOW_BODY_CLASS[rendererData.type];
		if (bodyClass === undefined) {
			return;
		}

		document.body.classList.add(bodyClass);

		return () => {
			document.body.classList.remove(bodyClass);
		};
	}, [rendererData.type]);

	useEffect(() => {
		changeLanguage(rendererData.locale)
			.catch((error) => {
				loggerServiceProxy().error('useMenuWindow(): changeLanguage() error', error);
			})
			.finally(() => {
				setIsReady(true);
			});
	}, [rendererData]);

	const close = useCallback(() => {
		closeMenuWindow(rendererData.type);
	}, [rendererData.type]);

	useOutsideClick<HTMLDivElement>(
		menuRef,
		isVisible,
		close,
		{
			escape: true,
		}
	);

	return { menuRef, anchorMenuRef, isReady, isVisible, rendererData, close };
}
