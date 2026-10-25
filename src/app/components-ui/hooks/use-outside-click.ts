import { useCallback, useEffect } from 'react';

import { KeyboardEventKey } from '../../../utils';

type CloseCallback = React.Dispatch<React.SetStateAction<boolean>> | ((value: boolean) => void);

interface CloseEvents {
	escape?: boolean;
	scroll?: boolean;
	resize?: boolean;
}

const mouseEventTypes = ['mousedown', 'click', 'mouseup', 'contextmenu'];

const EVENT_LISTENER_TIMEOUT = 150;

export function useOutsideClick<T extends HTMLElement>(
	elementRef: React.RefObject<T>,
	isOpened: boolean,
	closeCallback: CloseCallback,
	options: CloseEvents = {},
): void {
	const {
		escape = false,
		scroll = false,
		resize = false,
	} = options;

	const handleClose = useCallback((): void => {
		closeCallback(false);
	/**
	 * the following disable is required because closeCallback
	 * is recreated on every render
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!isOpened) {
			return;
		}

		const preventAnyNextOutsideClick = (ev: Event): void => {
			if (elementRef.current?.contains(ev.target as HTMLElement)) {
				return;
			}

			ev.stopPropagation();
			ev.preventDefault();

			handleClose();
		};

		const handleCloseByEscape = (ev: KeyboardEvent): void => {
			if (ev.key === KeyboardEventKey.Escape) {
				handleClose();
			}
		};

		mouseEventTypes.forEach((eventType) => {
			setTimeout(() => {
				document.addEventListener(eventType, preventAnyNextOutsideClick, true);
			}, EVENT_LISTENER_TIMEOUT);
		});

		if (escape) {
			document.addEventListener('keydown', handleCloseByEscape);
		}

		if (scroll) {
			document.addEventListener('scroll', handleClose);
		}

		if (resize) {
			window.addEventListener('resize', handleClose);
		}

		return () => {
			mouseEventTypes.forEach((eventType) => {
				setTimeout(() => {
					document.removeEventListener(eventType, preventAnyNextOutsideClick, true);
				}, EVENT_LISTENER_TIMEOUT);
			});

			if (escape) {
				document.removeEventListener('keydown', handleCloseByEscape);
			}

			if (scroll) {
				document.removeEventListener('scroll', handleClose);
			}

			if (resize) {
				window.removeEventListener('resize', handleClose);
			}
		};
	}, [elementRef, escape, handleClose, isOpened, resize, scroll]);
}
