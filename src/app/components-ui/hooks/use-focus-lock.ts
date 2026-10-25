import { useEffect } from 'react';

type Focusable = HTMLElement & { focus(): void; };

interface HandleTabOptions<T> {
	ev: KeyboardEvent;
	ref: React.RefObject<T>;
	firstFocusableElement: Element;
	lastFocusableElement: Element;
}

function isFocusable(element: Element): element is Focusable {
	return !!element && 'focus' in element && typeof element.focus === 'function';
}

const stopKeyboardEventPropagationHandler = (ev: KeyboardEvent): void => {
	ev.stopPropagation();
};

function handleTabForwards<T extends HTMLElement>({
	ev,
	ref,
	firstFocusableElement,
	lastFocusableElement,
}: HandleTabOptions<T>): void {
	if (ev.target === lastFocusableElement) {
		ev.preventDefault();

		isFocusable(firstFocusableElement)
			? firstFocusableElement.focus()
			: ref.current?.focus();
	}
}

function handleTabBackwards<T extends HTMLElement>({
	ev,
	ref,
	firstFocusableElement,
	lastFocusableElement,
}: HandleTabOptions<T>): void {
	if (ev.target === firstFocusableElement || ev.target === ref.current) {
		ev.preventDefault();

		isFocusable(lastFocusableElement)
			? lastFocusableElement.focus()
			: ref.current?.focus();
	}
}

export function useFocusLock<T extends HTMLElement>(ref: React.RefObject<T>): void {
	useEffect(() => {
		if (!ref.current?.contains(document.activeElement)) {
			ref.current?.focus();
		}

		const keyDownHandler = (ev: KeyboardEvent): void => {
			if (ev.code !== 'Tab') {
				return;
			}

			ev.stopPropagation();

			const focusableElements = ref.current?.querySelectorAll('button, [href], input, [tabindex="0"]') ?? [];
			const firstFocusableElement = focusableElements[0];
			const lastFocusableElement = focusableElements[focusableElements.length - 1];

			if (!ev.shiftKey) {
				handleTabForwards<T>({ ev, ref, firstFocusableElement, lastFocusableElement });
			}
			else {
				handleTabBackwards<T>({ ev, ref, firstFocusableElement, lastFocusableElement });
			}
		};

		// catching keydown event on capture phase to prevent seeing outline on a next focusable element when tabbing
		document.addEventListener('keydown', keyDownHandler, true);
		document.addEventListener('keypress', stopKeyboardEventPropagationHandler);
		document.addEventListener('keyup', stopKeyboardEventPropagationHandler);

		return () => {
			document.removeEventListener('keydown', keyDownHandler, true);
			document.removeEventListener('keypress', stopKeyboardEventPropagationHandler);
			document.removeEventListener('keyup', stopKeyboardEventPropagationHandler);
		};
	}, [ref]);
}
