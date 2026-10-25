import { isWin32 } from '../utils';
import { getNativeBridge } from './tvd-bridge';

interface WindowsInterop {
	setWindowPlacement(windowHandler: number, left: number, top: number, right: number, bottom: number, show: ShowWindow): boolean;
	getWindowsUpdateBuildRevision(): number;
	openExternalIgnoringAppLinking(url: string): void;
	registerApplicationRestart(): void;
}

export enum ShowWindow {
	SW_NORMAL = 1,
}

export function setWindowPlacement(windowHandler: number, left: number, top: number, right: number, bottom: number, show: ShowWindow): boolean {
	if (!isWin32()) {
		throw new Error('This API available on Windows only');
	}

	const windows = getNativeBridge().windows as WindowsInterop;
	return windows.setWindowPlacement(windowHandler, left, top, right, bottom, show);
}

export function getWindowsUpdateBuildRevision(): number {
	if (!isWin32()) {
		throw new Error('This API available on Windows only');
	}

	const windows = getNativeBridge().windows as WindowsInterop;
	return windows.getWindowsUpdateBuildRevision();
}

export function openExternalIgnoringAppLinking(url: string): Promise<void> {
	if (!isWin32()) {
		throw new Error('This API available on Windows only');
	}

	return new Promise(() => {
		const windows = getNativeBridge().windows as WindowsInterop;
		return windows.openExternalIgnoringAppLinking(url);
	});
}

export function registerApplicationRestart(): void {
	if (!isWin32()) {
		throw new Error('This API available on Windows only');
	}

	const windows = getNativeBridge().windows as WindowsInterop;
	windows.registerApplicationRestart();
}
