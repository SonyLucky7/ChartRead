export function hasDatasetId(ev: KeyboardEvent, keys: string[]): boolean {
	if (ev.target && keys.includes(ev.code) && ev.target instanceof HTMLElement) {
		return !!ev.target.dataset?.id;
	}
	else {
		return false;
	}
}

export function keyUpRemoveActive(ev: KeyboardEvent): void {
	if (ev.target instanceof HTMLElement && ev.target.classList.contains('active')) {
		ev.target.classList.remove('active');
	}
}

export function keyDownAddActive(ev: KeyboardEvent): void {
	if (!hasDatasetId(ev, ['Space', 'Enter'])) {
		return;
	}
	if (ev.target instanceof HTMLElement && !ev.target.classList.contains('active')) {
		ev.target.classList.add('active');
	}
}

export const BREAKING_SPACE_CHAR = '\u00A0';
