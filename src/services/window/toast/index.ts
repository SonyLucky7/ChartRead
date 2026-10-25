import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

import { Dimensions } from '../../interfaces';

export interface IToastWindow extends IToastWindowHandler, IToastWindowControl { }

export interface ToastWindowOptions {
	windowOptions?: BrowserWindowConstructorOptions;
	isDisposeToastOnLocaleChange?: boolean;
	shouldEnableRemote?: boolean;
}

export type ToastAttachPosition = 'top' | 'bottom';

export interface IToastWindowHandler {
	loadToast(toast: ToastData): Promise<void>;
	attachToWindow(wnd: BrowserWindow, position: ToastAttachPosition): void;
	detachFromWindow(): void;
	setAlwaysOnTop(flag: boolean, level?: string, relativeLevel?: number): void;
	setToastSize(dimensions: Dimensions): void;
	setParentWindow(wnd: BrowserWindow): void;
	registerDimensionsCalcView(id: string): void;
}

export interface IToastWindowControl {
	show(wnd: BrowserWindow): Promise<void>;
	hide(): void;
	isDestroyed(): boolean;
	isLoaded(): boolean;
	dispose(): void;
}

export type ToastWindowLevel = 'modal-panel' | 'pop-up-menu' | 'screen-saver';

export interface IToastView {
	getToastViewDimensions(): Promise<Dimensions>;
}

export type ToastData = DownloadToast | FullscreenToast | ZoomToast;

/* eslint-disable @typescript-eslint/naming-convention */
export const ToastRendererType = {
	Download: 'download',
	Fullscreen: 'fullscreen',
	Zoom: 'zoom',
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

export type ToastRendererType = (typeof ToastRendererType)[keyof typeof ToastRendererType];

export interface BasicToastMessage {
	readonly text: string;
}

export interface BasicToast<M = BasicToastMessage> {
	rendererType: ToastRendererType;
	message?: M;
}

export interface DownloadToast extends BasicToast {
	rendererType: typeof ToastRendererType.Download;
	message: BasicToastMessage;
}

export interface FullscreenToastMessage extends BasicToastMessage {
	readonly key: string;
}

export interface FullscreenToast extends BasicToast<FullscreenToastMessage> {
	rendererType: typeof ToastRendererType.Fullscreen;
	message: FullscreenToastMessage;
}

export interface ZoomToast extends BasicToast {
	rendererType: typeof ToastRendererType.Zoom;
}
