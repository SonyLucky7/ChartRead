import { BrowserWindow } from 'electron';

import { ExposeSingletonService, IpcServices } from '../../../ipc-services';
import { loggerService } from '../../../logger';
import { isDarwin } from '../../../utils';
import { ToastData, ToastRendererType } from '../toast';
import { TOAST_PRESETS, ToastHideTrigger, ToastPreset } from '../toast/toast-preset';
import { ToastWindow } from '../toast/toast-window';
import { IToastService, TOAST_SERVICE_CONTRACT } from './itoast-service';

@ExposeSingletonService(TOAST_SERVICE_CONTRACT, IpcServices.getProvider())
export class ToastService implements IToastService {
	private readonly windows = new Map<ToastRendererType, ToastWindow>();
	private readonly hideTimers = new Map<ToastRendererType, NodeJS.Timeout>();
	private readonly loadedContent = new Map<ToastRendererType, string>();
	private readonly hideTriggerCleanups = new Map<ToastRendererType, () => void>();
	private readonly owners = new Map<ToastRendererType, BrowserWindow>();

	async show(toast: ToastData, wnd: BrowserWindow): Promise<void> {
		const kind = toast.rendererType;
		const preset = TOAST_PRESETS[kind];
		const toastWindow = this.getOrCreateWindow(kind, preset);

		this.clearHideTimer(kind);

		try {
			const contentKey = JSON.stringify(toast);
			if (!toastWindow.isLoaded() || this.loadedContent.get(kind) !== contentKey) {
				await toastWindow.loadToast(toast);
				this.loadedContent.set(kind, contentKey);
			}

			this.attach(toastWindow, preset, wnd);

			await toastWindow.show(wnd);
		}
		catch (error) {
			loggerService().error(`ToastService.show(${ kind })`, error);
			this.hide(kind);
			return;
		}

		if (wnd.isDestroyed()) {
			return;
		}

		this.owners.set(kind, wnd);

		this.armHideTriggers(kind, wnd, preset);
	}

	hide(kind: ToastRendererType, owner?: BrowserWindow): void {
		if (this.isForeignOwner(kind, owner)) {
			return;
		}

		this.clearHideTimer(kind);
		this.clearHideTriggers(kind);
		this.owners.delete(kind);

		const toastWindow = this.windows.get(kind);
		if (!toastWindow || toastWindow.isDestroyed()) {
			this.windows.delete(kind);
			return;
		}

		// On macOS hiding (instead of destroying) some toasts hides the main window too.
		if (TOAST_PRESETS[kind].lifecycle === 'dispose-on-macos' && isDarwin()) {
			this.dispose(kind);
			return;
		}

		toastWindow.hide();
	}

	dispose(kind: ToastRendererType, owner?: BrowserWindow): void {
		if (this.isForeignOwner(kind, owner)) {
			return;
		}

		this.clearHideTimer(kind);
		this.clearHideTriggers(kind);
		this.owners.delete(kind);

		const toastWindow = this.windows.get(kind);
		this.windows.delete(kind);
		this.loadedContent.delete(kind);

		if (toastWindow && !toastWindow.isDestroyed()) {
			toastWindow.dispose();
		}
	}

	private isForeignOwner(kind: ToastRendererType, owner?: BrowserWindow): boolean {
		if (owner === undefined) {
			return false;
		}

		const current = this.owners.get(kind);

		return current !== undefined && current !== owner;
	}

	private attach(toastWindow: ToastWindow, preset: ToastPreset, wnd: BrowserWindow): void {
		toastWindow.attachToWindow(wnd, preset.attachPosition);

		if (preset.attachPosition === 'top') {
			toastWindow.setAlwaysOnTop(true, 'pop-up-menu', 1);
		}
	}

	private getOrCreateWindow(kind: ToastRendererType, preset: ToastPreset): ToastWindow {
		const existing = this.windows.get(kind);
		if (existing !== undefined && !existing.isDestroyed()) {
			return existing;
		}

		const toastWindow = new ToastWindow({
			windowOptions: preset.windowOptions,
			shouldEnableRemote: preset.shouldEnableRemote,
		});

		this.windows.set(kind, toastWindow);
		this.loadedContent.delete(kind);

		return toastWindow;
	}

	private armHideTriggers(kind: ToastRendererType, wnd: BrowserWindow, preset: ToastPreset): void {
		// Drop anything left over from a previous show (e.g. an interleaved show() whose
		// timer would otherwise stay live and hide this toast early).
		this.clearHideTriggers(kind);
		this.clearHideTimer(kind);

		const registered: Array<[ToastHideTrigger, () => void]> = [];
		for (const trigger of preset.hideOn) {
			const listener = (): void => {
				if (trigger === 'minimize') {
					this.windows.get(kind)?.detachFromWindow();
				}
				this.hide(kind);
			};
			// All hide triggers take a no-arg listener; cast narrows the overloaded event name.
			wnd.on(trigger as 'move', listener);
			registered.push([trigger, listener]);
		}

		if (registered.length > 0) {
			// We remove these explicitly in clearHideTriggers (every hide path runs it).
			this.hideTriggerCleanups.set(kind, () => {
				for (const [trigger, listener] of registered) {
					wnd.removeListener(trigger as 'move', listener);
				}
			});
		}

		if (preset.autoHideMs !== null) {
			this.hideTimers.set(kind, setTimeout(() => this.hide(kind), preset.autoHideMs));
		}
	}

	private clearHideTimer(kind: ToastRendererType): void {
		const timer = this.hideTimers.get(kind);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.hideTimers.delete(kind);
		}
	}

	private clearHideTriggers(kind: ToastRendererType): void {
		const cleanup = this.hideTriggerCleanups.get(kind);
		if (cleanup) {
			cleanup();
			this.hideTriggerCleanups.delete(kind);
		}
	}
}
