import { logCall } from '../../logger/log-decorator';

export type Listener = () => void;

export enum WindowServiceEvents {
	AllWindowsClosed,
	Initialize,
	Dispose,
}

export interface IWithListener {
	on(event: WindowServiceEvents, listener: Listener): void;
	notifyListeners(event: WindowServiceEvents, clearListeners: boolean): void;
	clearListeners(): void;
}

export class WithListener implements IWithListener {
	private eventListeners = new Map<WindowServiceEvents, Listener[]>();

	on(event: WindowServiceEvents, listener: Listener): void {
		const listeners = this.eventListeners.get(event) ?? [];
		listeners.push(listener);

		this.eventListeners.set(event, listeners);
	}

	@logCall
	notifyListeners(event: WindowServiceEvents, clearListeners = true): void {
		const listeners = this.eventListeners.get(event);

		if (!listeners) {
			return;
		}

		for (const listener of listeners) {
			listener();
		}

		if (clearListeners) {
			this.eventListeners.delete(event);
		}
	}

	clearListeners(): void {
		this.eventListeners.clear();
	}
}
