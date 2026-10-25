import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { isDarwin } from '../utils/platform';
import { areEqual } from '../utils/Position';
import { ButtonEvent, ButtonsEventData, HardwareInterop, MotionEventData, MouseButton, PointerCaptureInterop } from './hardware';
import { getMouseButtonState } from './hwtools';
import { PointerCapture } from './pointer-capture';
import { getNativeBridge } from './tvd-bridge';

let instance: PointerCapture | undefined;

function withUnsubscribeCallback<T>(unsubCallback: () => void): (observable: Observable<T>) => Observable<T> {
	return (observable) => new Observable((subscriber) => {
		const subs = observable.subscribe(subscriber);

		return () => {
			subs.unsubscribe();
			unsubCallback();
		};
	});
}

class PointerCaptureDarwin implements PointerCapture {
	private readonly screen: Electron.Screen;
	private readonly onMotionSubject = new Subject<MotionEventData>();
	private readonly onButtonsSubject = new Subject<ButtonsEventData>();

	private motionInterval: NodeJS.Timeout | undefined;
	private buttonsInterval: NodeJS.Timeout | undefined;

	private readonly buttonsPollInv = 20;

	constructor(screen: Electron.Screen) {
		this.screen = screen;
	}

	onMotion(): Observable<MotionEventData> {
		if (!this.motionInterval) {
			this.createMotionTracker();
		}

		return this.onMotionSubject.pipe(withUnsubscribeCallback(() => this.stopCapturing()));
	}

	onButtons(): Observable<ButtonsEventData> {
		if (!this.buttonsInterval) {
			this.createButtonsTracker();
		}

		return this.onButtonsSubject.pipe(withUnsubscribeCallback(() => this.stopCapturing()));
	}

	private createMotionTracker(): void {
		if (this.motionInterval) {
			return;
		}

		this.motionInterval = setInterval(() => {
			const screenPoint = this.screen.getCursorScreenPoint();

			this.onMotionSubject.next({ screenPoint, offset: { x: 0, y: 0 } });
		}, 2);
	}

	private createButtonsTracker(): void {
		if (this.buttonsInterval) {
			return;
		}

		this.buttonsInterval = setInterval(() => {
			const event: ButtonEvent = getMouseButtonState(MouseButton.Left) ? ButtonEvent.Down : ButtonEvent.Up;

			this.onButtonsSubject.next({ left: event, right: ButtonEvent.None, middle: ButtonEvent.None });
		}, this.buttonsPollInv);
	}

	private stopCapturing(): void {
		if (this.onButtonsSubject.observers.length === 0 && this.onMotionSubject.observers.length === 0) {
			this.resetIntervals();
		}
	}

	private resetIntervals(): void {
		if (this.motionInterval) {
			clearInterval(this.motionInterval);
			this.motionInterval = undefined;
		}

		if (this.buttonsInterval) {
			clearInterval(this.buttonsInterval);
			this.buttonsInterval = undefined;
		}
	}
}

class PointerCaptureInteropWrapper implements PointerCapture {
	private captureInterop: PointerCaptureInterop | undefined;
	private onMotionSubject = new Subject<MotionEventData>();
	private onButtonsSubject = new Subject<ButtonsEventData>();

	constructor() {
		this.captureInterop = (getNativeBridge().hardware as HardwareInterop)?.capturePointer();

		this.captureInterop.setButtonsEventCallback((data: ButtonsEventData): void => {
			this.onButtonsSubject.next(data);
		});

		this.captureInterop.setMotionEventCallback((data: MotionEventData): void => {
			this.onMotionSubject.next(data);
		});
	}

	onMotion(): Observable<MotionEventData> {
		if (!this.captureInterop) {
			throw new Error('Capturer object disposed');
		}

		this.captureInterop.startCapturing();

		return this.onMotionSubject.pipe(
			distinctUntilChanged((x, y) => areEqual(x.screenPoint, y.screenPoint, 2)),
			debounceTime(2),
			withUnsubscribeCallback(() => this.stopCapturing())
		);
	}

	onButtons(): Observable<ButtonsEventData> {
		if (!this.captureInterop) {
			throw new Error('Capturer object disposed');
		}

		this.captureInterop.startCapturing();

		return this.onButtonsSubject.pipe(withUnsubscribeCallback(() => () => this.stopCapturing()));
	}

	private stopCapturing(): void {
		if (this.onButtonsSubject.observers.length === 0 && this.onMotionSubject.observers.length === 0) {
			this.captureInterop?.stopCapturing();
		}
	}
}

export function capturePointer(): PointerCapture {
	if (!instance) {
		if (isDarwin()) {
			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
			const screen = require('@electron/remote').screen as Electron.Screen;
			instance = new PointerCaptureDarwin(screen);
		}
		else {
			instance = new PointerCaptureInteropWrapper();
		}
	}

	return instance;
}
