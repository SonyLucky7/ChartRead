import { Subject } from 'rxjs';

// TODO: write unit tests

export abstract class StatefulService<TState> {
	private readonly bufferDelay = 20;
	protected state: TState | Record<string, never> = {};
	private stateChangedSubject = new Subject<TState>();

	protected stateChanged = this.stateChangedSubject.asObservable();

	protected setState(state: Partial<TState>, notify = true): void {
		if (Object.keys(this.state ?? {}).length === 0) {
			return;
		}
		const keys = Object.getOwnPropertyNames(state);

		if (keys.length === 0) {
			return;
		}

		for (const key of keys) {
			(this.state as Record<string, unknown>)[key] = (state as Record<string, unknown>)[key];
		}

		if (notify) {
			this.stateChangedSubject.next(this.state as TState);
		}
	}
}
