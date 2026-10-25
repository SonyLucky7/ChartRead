import { BrowserWindow } from 'electron';

import { ToastData, ToastRendererType } from '../toast';

export const TOAST_SERVICE_CONTRACT = 'tvd:toast-service';

/**
 * Single entry point for every toast kind. The concrete behaviour (attach position,
 * auto-hide, lifecycle, hide triggers) is resolved from the toast's `rendererType`
 * via `TOAST_PRESETS`, so callers only pass the payload.
 */
export interface IToastService {
	show(toast: ToastData, wnd: BrowserWindow): Promise<void>;
	hide(kind: ToastRendererType, owner?: BrowserWindow): void;
	dispose(kind: ToastRendererType, owner?: BrowserWindow): void;
}
