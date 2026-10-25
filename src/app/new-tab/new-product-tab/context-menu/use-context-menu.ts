import { RefObject, useCallback, useRef, useState } from 'react';

import { MenuCloseEventSource } from '../../../../services/window/window-api';
import { Position } from '../../../../utils';
import { getWindowControl } from '../../../common/app-common';
import { useObservable, useOutsideClick } from '../../../components-ui/hooks';

export interface ContextMenuState {
	isOpened: boolean;
	position: Position;
	visibility: 'hidden' | 'visible';
	title: string;
	url: string;
}

interface UseContextMenu {
	contextMenu: ContextMenuState;
	menuRef: React.RefObject<HTMLUListElement>;
	setContextMenuData(options: Omit<ContextMenuState, 'visibility'>): void;
	resetContextMenuData(): void;
	currentContextMenuContainer: RefObject<HTMLElement>;
	pushContextMenuContainer(targetContainer: RefObject<HTMLElement>): void;
	popContextMenuContainers(): void;
}

export type ContextMenuContext = Partial<Pick<UseContextMenu, 'setContextMenuData' | 'pushContextMenuContainer' | 'popContextMenuContainers'>>;

export const initialContextMenuState: ContextMenuState = {
	isOpened: false,
	position: { x: 0, y: 0 },
	visibility: 'hidden',
	title: '',
	url: '',
};

export function useContextMenu(): UseContextMenu {
	const menuRef = useRef<HTMLUListElement>(null);

	const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialContextMenuState);
	const [contextMenuContainers, setContextMenuContainers] = useState<RefObject<HTMLElement>[]>([]);

	const resetContextMenuData = useCallback(() => {
		setContextMenu(initialContextMenuState);
	}, []);

	const menuCloseEventHandler = (value: MenuCloseEventSource): void => {
		if (value === 'context-menu') {
			return;
		}

		resetContextMenuData();
	};

	useObservable<MenuCloseEventSource>(
		getWindowControl().menuCloseEvent,
		menuCloseEventHandler,
		[window.remoteServiceInstanceId]
	);

	useOutsideClick<HTMLUListElement>(
		menuRef,
		contextMenu.isOpened,
		resetContextMenuData,
		{
			escape: true,
			scroll: true,
			resize: true,
		}
	);

	const setContextMenuData = useCallback((newState: Omit<ContextMenuState, 'visibility'>) => {
		setContextMenu({ ...newState, visibility: 'hidden' });

		setTimeout(() => {
			if (!menuRef.current) {
				return;
			}

			const { innerWidth, innerHeight } = window;
			const { width, height, x, y } = menuRef.current.getBoundingClientRect();
			const containerBoundingRect = contextMenuContainers[contextMenuContainers.length - 1].current?.getBoundingClientRect();

			const willOverflowX = newState.position.x + width > innerWidth;
			const willOverflowY = newState.position.y + height > innerHeight;

			setContextMenu((prevState) => {
				const newPositionX = prevState.position.x !== x
					? prevState.position.x - (containerBoundingRect?.x ?? 0)
					: prevState.position.x;

				const newPositionY = prevState.position.y !== y
					? prevState.position.y - (containerBoundingRect?.y ?? 0)
					: prevState.position.y;

				return {
					...prevState,
					position: {
						x: willOverflowX ? newPositionX - width : newPositionX,
						y: willOverflowY ? newPositionY - height : newPositionY,
					},
					visibility: 'visible',
				};
			}
			);
		}, 0);
	}, [menuRef, contextMenuContainers]);

	const pushContextMenuContainer = useCallback((targetContainer: RefObject<HTMLElement>) => {
		setContextMenuContainers((prevState) => [...prevState, targetContainer]);
	}, []);

	const popContextMenuContainers = useCallback(() => {
		setContextMenuContainers((prevState) => prevState.slice(0, -1));
	}, []);

	return {
		contextMenu,
		menuRef,
		setContextMenuData,
		resetContextMenuData,
		currentContextMenuContainer: contextMenuContainers[contextMenuContainers.length - 1] ?? null,
		pushContextMenuContainer,
		popContextMenuContainers,
	};
}
