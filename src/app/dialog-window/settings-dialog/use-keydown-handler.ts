import { useCallback, useEffect } from 'react';

import { KeyboardEventKey } from '../../../utils';

export function useKeyDownHandler(
	keyDownCheckboxActions: Record<string, RxJSNext<boolean> | ((value: boolean) => void)>
): void {
	const keyDownHandler = useCallback((ev: KeyboardEvent): void => {
		if (
			ev.code !== KeyboardEventKey.Enter ||
			!(ev.target instanceof HTMLInputElement) ||
			!keyDownCheckboxActions[ev.target.id]
		) {
			return;
		}

		keyDownCheckboxActions[ev.target.id](!ev.target.checked);
	}, [keyDownCheckboxActions]);

	useEffect(() => {
		document.addEventListener('keydown', keyDownHandler);

		return () => {
			document.removeEventListener('keydown', keyDownHandler);
		};
	}, [keyDownHandler]);
}
