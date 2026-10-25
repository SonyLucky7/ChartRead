import { useEffect, useLayoutEffect, useRef } from 'react';

import { HotkeySequenceItem, HotkeySequenceTracker } from './hotkey-sequence-tracker';

const KEY_CODE_PATTERN = /^Key([A-Z])$/;

/**
 * Elements marked with this attribute (e.g. opened menus rendered via portals)
 * suppress the hotkeys while they are present in the DOM.
 */
export const BLOCKS_HOTKEYS_ATTRIBUTE = 'data-blocks-hotkeys';

/**
 * Generates a data attribute marking an element as a hotkeys blocker.
 */
export const getBlocksHotkeysDataAttributes = (): { [BLOCKS_HOTKEYS_ATTRIBUTE]: true; } => ({
	[BLOCKS_HOTKEYS_ATTRIBUTE]: true,
});

interface UseHotkeysOptions {
	hotkeyCallbacks: HotkeySequenceItem[];
	isEnabled?(): boolean;
}

export function useHotkeys({ hotkeyCallbacks, isEnabled }: UseHotkeysOptions): void {
	const trackerRef = useRef<HotkeySequenceTracker | null>(null);

	if (trackerRef.current === null) {
		trackerRef.current = new HotkeySequenceTracker();
	}

	// The keydown handler reads the options through refs so the document listener
	// is subscribed once per mount and an in-progress sequence survives re-renders.
	const hotkeyCallbacksRef = useRef(hotkeyCallbacks);
	const isEnabledRef = useRef(isEnabled);

	useLayoutEffect(() => {
		hotkeyCallbacksRef.current = hotkeyCallbacks;
		isEnabledRef.current = isEnabled;
	});

	useEffect(() => {
		const tracker = trackerRef.current;

		if (tracker === null) {
			return;
		}

		const handleKeyDown = (ev: KeyboardEvent): void => {
			if (
				ev.ctrlKey ||
				ev.metaKey ||
				ev.altKey ||
				ev.repeat ||
				ev.target instanceof HTMLInputElement
			) {
				return;
			}

			const isEnabledCurrent = isEnabledRef.current;
			if (isEnabledCurrent !== undefined && !isEnabledCurrent()) {
				return;
			}

			const keyCodeMatch = KEY_CODE_PATTERN.exec(ev.code);
			if (keyCodeMatch === null) {
				return;
			}

			tracker.handleKey(keyCodeMatch[1], hotkeyCallbacksRef.current);
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			tracker.dispose();
		};
	}, []);
}
