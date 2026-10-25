import { useEffect } from 'react';
import { Observable, Subscription } from 'rxjs';

export function useObservable<T>(
	observable?: Observable<T>,
	observableCallback?: (value: T) => void,
	deps: ReadonlyArray<unknown> = []
): void {
	useEffect(() => {
		if (!observable) {
			return;
		}

		let subscription: Subscription | null = observable.subscribe(observableCallback);

		const unsubscribe = (): void => {
			subscription?.unsubscribe();
			subscription = null;
		};

		window.addEventListener('beforeunload', unsubscribe);

		return () => {
			window.removeEventListener('beforeunload', unsubscribe);
			unsubscribe();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}
