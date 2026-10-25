import { Disposable } from '../../../tvd-runtime/core';

export interface HotkeySequenceItem {
	hotkey: string[];
	cb(): void;
}

export const HOTKEY_SEQUENCE_RESET_DELAY_MS = 1500;

/**
 * Tracks sequential key presses (e.g. "s" then "a") and fires the callback
 * of the item whose hotkey sequence is completed. A sequence in progress is
 * reset if the next key is not pressed within the reset delay. A key that
 * breaks the current sequence is re-evaluated as the start of a new one.
 */
export class HotkeySequenceTracker implements Disposable {
	private buffer: string[] = [];
	private resetTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private readonly resetDelayMs: number = HOTKEY_SEQUENCE_RESET_DELAY_MS,
	) {}

	public dispose(): void {
		this.reset();
	}

	public reset(): void {
		this.buffer = [];

		if (this.resetTimer !== null) {
			clearTimeout(this.resetTimer);
			this.resetTimer = null;
		}
	}

	public handleKey(key: string, items: HotkeySequenceItem[]): void {
		const keyNormalized = key.toLowerCase();
		const candidate = [...this.buffer, keyNormalized];

		if (this.tryMatch(candidate, items)) {
			return;
		}

		if (candidate.length > 1 && this.tryMatch([keyNormalized], items)) {
			return;
		}

		this.reset();
	}

	private tryMatch(candidate: string[], items: HotkeySequenceItem[]): boolean {
		const matchedItem = items.find(({ hotkey }) =>
			hotkey.length === candidate.length &&
			candidate.every((key, index) => hotkey[index].toLowerCase() === key)
		);

		if (matchedItem !== undefined) {
			this.reset();
			matchedItem.cb();

			return true;
		}

		const isPrefixOfLongerSequence = items.some(({ hotkey }) =>
			hotkey.length > candidate.length &&
			candidate.every((key, index) => hotkey[index].toLowerCase() === key)
		);

		if (isPrefixOfLongerSequence) {
			this.buffer = candidate;
			this.restartResetTimer();

			return true;
		}

		return false;
	}

	private restartResetTimer(): void {
		if (this.resetTimer !== null) {
			clearTimeout(this.resetTimer);
		}

		this.resetTimer = setTimeout(() => {
			this.resetTimer = null;
			this.reset();
		}, this.resetDelayMs);
	}
}
