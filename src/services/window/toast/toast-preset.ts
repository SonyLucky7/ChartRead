import { BrowserWindowConstructorOptions } from 'electron';

import { isDarwin } from '../../../utils';
import { ToastAttachPosition, ToastRendererType } from '.';

export type ToastHideTrigger = 'move' | 'close' | 'minimize' | 'resize';

export type ToastLifecycle = 'hide' | 'dispose-on-macos';

export interface ToastPreset {
	readonly attachPosition: ToastAttachPosition;
	/** `null` means the caller controls hiding (e.g. fullscreen orchestration). */
	readonly autoHideMs: number | null;
	readonly hideOn: readonly ToastHideTrigger[];
	readonly lifecycle: ToastLifecycle;
	readonly shouldEnableRemote: boolean;
	readonly windowOptions?: BrowserWindowConstructorOptions;
}

const DOWNLOAD_HIDE_MS = 4_000;
const ZOOM_HIDE_MS = 2_000;

export const TOAST_PRESETS: Record<ToastRendererType, ToastPreset> = {
	[ToastRendererType.Download]: {
		attachPosition: 'bottom',
		autoHideMs: DOWNLOAD_HIDE_MS,
		hideOn: ['move', 'close', 'minimize', 'resize'],
		lifecycle: 'hide',
		shouldEnableRemote: true,
		windowOptions: { modal: isDarwin() },
	},
	[ToastRendererType.Zoom]: {
		attachPosition: 'top',
		autoHideMs: ZOOM_HIDE_MS,
		hideOn: ['move', 'minimize', 'resize'],
		lifecycle: 'hide',
		shouldEnableRemote: false,
	},
	[ToastRendererType.Fullscreen]: {
		attachPosition: 'top',
		autoHideMs: null,
		hideOn: [],
		lifecycle: 'dispose-on-macos',
		shouldEnableRemote: false,
	},
};
