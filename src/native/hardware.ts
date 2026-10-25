import { Disposable } from '../tvd-runtime/core';

export interface Point {
	x: number;
	y: number;
}

export enum ButtonEvent {
	None,
	Up,
	Down,
}

export enum MouseButton {
	Left,
	Middle,
	Right,
}

export interface ButtonsEventData {
	left: ButtonEvent;
	right: ButtonEvent;
	middle: ButtonEvent;
}

export interface MotionEventData {
	offset: Point;
	screenPoint: Point;
}

export interface PointerCaptureInterop extends Disposable {
	setButtonsEventCallback(cb?: (data: ButtonsEventData) => void): void;
	setMotionEventCallback(cb?: (data: MotionEventData) => void): void;
	startCapturing(): void;
	stopCapturing(): void;
}

export interface HardwareInterop {
	capturePointer(): PointerCaptureInterop;
	getButtonState(index: MouseButton): boolean;
}
