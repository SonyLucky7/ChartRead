import { Disposable } from '../tvd-runtime/core';
import { getNativeBridge } from './tvd-bridge';

type ErrorCallback = (errorMessage: string) => void;

interface AutoUpdaterInterop extends Disposable {
	applyUpdate(msixUri: string): void;
	getUpdateErrors(filter: string): string[];
	setErrorHandler(callback: ErrorCallback): void;
}

export function applyUpdate(msixUri: string): void {
	const autoUpdater = getNativeBridge().msix_auto_updater as AutoUpdaterInterop;
	autoUpdater.applyUpdate(msixUri);
}

export function getUpdateErrors(filter: string): string[] {
	const autoUpdater = getNativeBridge().msix_auto_updater as AutoUpdaterInterop;
	return autoUpdater.getUpdateErrors(filter);
}

export function setErrorHandler(callback: ErrorCallback): void {
	const autoUpdater = getNativeBridge().msix_auto_updater as AutoUpdaterInterop;
	autoUpdater.setErrorHandler(callback);
}

export function disposeAutoupdater(): void {
	const autoUpdater = getNativeBridge().msix_auto_updater as AutoUpdaterInterop;
	autoUpdater.dispose();
}
