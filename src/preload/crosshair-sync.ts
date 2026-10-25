import { ipcRenderer } from 'electron';
import '@sentry/electron/preload';

import { IObservableValueReadOnly, SubscriberCallback } from '../tv-api/observable-value';
import { CROSSHAIR_SYNC_SETTING_UPDATE, GET_CROSSHAIR_SYNC } from '../tv-api/tvd-channels';

export function crosshairSync(): IObservableValueReadOnly<boolean> {
	let storedValue = true;
	const subscribers = new Map<string, SubscriberCallback<boolean>>();

	const updateValue = (value: boolean): void => {
		if (storedValue === value) {
			return;
		}

		storedValue = value;
		notify();
	};

	const notify = (): void => {
		subscribers.forEach(sub => sub(storedValue));
	};

	(ipcRenderer.invoke(GET_CROSSHAIR_SYNC) as Promise<boolean>)
		.then((value) => {
			updateValue(value);
		})
		.catch(err => console.log(err));

	ipcRenderer.on(CROSSHAIR_SYNC_SETTING_UPDATE, (ev, value: boolean) => {
		updateValue(value);
	});

	return {
		value(): boolean {
			return storedValue;
		},

		subscribe(callback: SubscriberCallback<boolean>): string {
			const id = self.crypto.randomUUID();
			subscribers.set(id, callback);

			return id;
		},

		unsubscribe(id: string): void {
			if (!subscribers.has(id)) {
				return;
			}

			subscribers.delete(id);
		},
	};
}
