import { screen } from 'electron';
import i18next from 'i18next';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { loggerService } from '../../../logger';
import { PointerCapture } from '../../../native/pointer-capture';
import { capturePointer } from '../../../native/pointer-capture-impl';
import { ignorePromise, isDarwin, isInBounds, sleep } from '../../../utils';
import { appSettingsService } from '../../app-settings-service';
import { TIMEOUT_HIDE_FULLSCREEN_WARNING, TIMEOUT_SHOW_FULLSCREEN_WARNING_MAC } from '../../interfaces';
import { mainMenuService } from '../../main-menu-service';
import { mainService } from '../../main-service';
import { ScreenPointConverter } from '../screen-point-converter';
import { Tab } from '../tab/tab';
import { TabbedWindowBase } from '../tabbed-window';
import { FullscreenToastMessage, ToastRendererType } from '../toast';
import { toastService } from '../toast-service';
import { IFullscreenHandler, WindowState } from '../window-api';
import { windowService } from '..';
import { WindowMixin } from './window-mixin';

enum FullscreenMode {
	None,
	OS,
	Html,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/naming-convention
export function Fullscreenable<T extends WindowMixin<TabbedWindowBase>>(Base: T) {
	class FullscreenableWindow extends Base implements IFullscreenHandler {
		private fullscreenTimeoutCancellation: AbortController | undefined = undefined;

		private currentFullscreenMode = FullscreenMode.None;

		private readonly windowStateChangeInv = 100;

		private pointConverter?: ScreenPointConverter;
		private capturer?: PointerCapture;
		private cursorSubscription?: Subscription;

		private menuOpenedSub?: Subscription;

		constructor(...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);
			this.windowStateChanged
				.pipe(debounceTime(this.windowStateChangeInv))
				.subscribe(state => this.onWindowStateChange(state));

			this.windowRef.on('closed', () => {
				this.pointConverter?.dispose();

				this.hideFullscreenWarningWindow(true);
			});

			// overriding base behavior to correctly handle html fullscreen on tab change
			this.setActiveTab = (tab: Tab): void => {
				const currentActiveTab = this.tabs.find(t => t.active);

				if (currentActiveTab && currentActiveTab.isFullscreened) {
					ignorePromise(this.closeHTMLFullscreen(currentActiveTab, () => super.setActiveTab(tab)));
					return;
				}

				super.setActiveTab(tab);
			};

			this.menuOpenedSub = mainMenuService().menuOpenedChange.subscribe(val => {
				if (this.panelDelayedTimeout) {
					clearTimeout(this.panelDelayedTimeout);
				}

				// TODO this.windowRef.isDestroyed() fixes bug with hide tab menu after detach/attach tab, but
				// perhubs we have a problem with update windowRef for tab menu
				// or with some extra instances of windows that aren't destroyed
				// or created at the wrong moment
				if (val || this.windowRef.isDestroyed()) {
					return;
				}

				const point = screen.getCursorScreenPoint();
				const bounds = this.windowRef.getBounds();
				bounds.height = this.getTitleHeight();
				this.topAreaHover(isInBounds(bounds, point));
			});

			if (!isDarwin()) {
				this.pointConverter = new ScreenPointConverter(screen, mainService());
				this.capturer = capturePointer();
			}
		}

		private requestFullscreenMode(activeTab: Tab): void {
			const newFullscreenMode = activeTab.isFullscreened ? FullscreenMode.Html : FullscreenMode.OS;
			if (newFullscreenMode === this.currentFullscreenMode) {
				return;
			}
			this.currentFullscreenMode = newFullscreenMode;

			activeTab.setBounds(this.computeViewBounds(this.shouldViewFullscreen()));

			const fullscreenWarning = this.currentFullscreenMode === FullscreenMode.Html
				? { text: i18next.t('Press ESC to exit full screen'), key: 'ESC' }
				: { text: i18next.t('Press F11 to exit full screen'), key: 'F11' };

			ignorePromise(this.doShowFullscreenWarning(fullscreenWarning));
		}

		/**
		 * Two kinds of the fullscreen mode:
		 * 1. HTML/TV Platform fullscreen (toggled from web page):
		 *  - cancelled by ESC key;
		 *  - need to showing info window on MacOS;
		 *
		 * 2. OS fullscreen (toggled by fullscreen key [F11]):
		 *  - cancelled by F11 key;
		 *  - info window should not be showed on MacOS;
		 */
		async doShowFullscreenWarning(data: FullscreenToastMessage): Promise<void> {
			if (this.windowRef.isDestroyed()) {
				loggerService().error('Calling doShowFullscreenWarning on window that was destroyed');
				return;
			}

			const tab = this.tabs.find(({ active }) => active);

			if (!tab || this.currentFullscreenMode === FullscreenMode.None) {
				return;
			}

			if (this.fullscreenTimeoutCancellation) {
				return;
			}
			if (isDarwin() && this.currentFullscreenMode === FullscreenMode.OS) {
				tab.setBounds(this.computeViewBounds(this.shouldViewFullscreen()));
				return;
			}

			this.fullscreenTimeoutCancellation = new AbortController();

			try {
				// without timeout on macOS the main screen with platform becomes hidden
				if (isDarwin() && !await sleep(TIMEOUT_SHOW_FULLSCREEN_WARNING_MAC, this.fullscreenTimeoutCancellation)) {
					tab.setBounds(this.computeViewBounds(this.shouldViewFullscreen()));
					return;
				}

				const bounds = this.windowRef.getBounds();
				tab.setBounds({ x: 0, y: 0, height: bounds.height, width: bounds.width });

				await this.showFullscreenToast(data);

				if (await sleep(TIMEOUT_HIDE_FULLSCREEN_WARNING, this.fullscreenTimeoutCancellation)) {
					this.hideFullscreenWarningWindow();
				}
			}
			finally {
				delete this.fullscreenTimeoutCancellation;
			}
		}

		private async showFullscreenToast(data: FullscreenToastMessage): Promise<void> {
			// Content de-duplication (skip reload when the message is unchanged) is handled by the service.
			await toastService().show({ rendererType: ToastRendererType.Fullscreen, message: data }, this.windowRef);
		}

		private hideFullscreenWarningWindow(forceClose = false): void {
			if (this.fullscreenTimeoutCancellation) {
				const cancellation = this.fullscreenTimeoutCancellation;
				delete this.fullscreenTimeoutCancellation;
				cancellation.abort();
			}

			// `hide()` destroys the window on macOS (otherwise the main window is hidden too);
			// `forceClose` (parent window closing) destroys it on every platform.
			if (forceClose) {
				toastService().dispose(ToastRendererType.Fullscreen, this.windowRef);
			}
			else {
				toastService().hide(ToastRendererType.Fullscreen, this.windowRef);
			}
		}

		private shouldViewFullscreen(): boolean {
			const macosDisabledFullscreen = isDarwin() && !appSettingsService().get('macosHideTabsInFullscreen');

			// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
			/* eslint-disable no-mixed-operators */
			return this.currentFullscreenMode === FullscreenMode.Html ||
				!macosDisabledFullscreen && this.currentFullscreenMode === FullscreenMode.OS;
			/* eslint-enable no-mixed-operators */
		}

		async closeHTMLFullscreen(tab?: Tab, action?: () => void): Promise<void> {
			const updatingTab = tab ?? this.tabs.find(t => this.activeTabId === t.id);

			if (!updatingTab) {
				return Promise.resolve();
			}

			try {
				await updatingTab.executeJavaScript('document.fullscreenElement ? document.exitFullscreen() : null', true) as Promise<void> | null;

				if (action) {
					action();
				}
			}
			catch (err) {
				loggerService().error('executeJavaScript document.exitFullscreen() error', err);
			}
		}

		private onWindowStateChange(state: WindowState): void {
			const activeTab = this.tabs.find(t => t.active);

			if (state === WindowState.Hidden || !activeTab) {
				return;
			}

			if (state === WindowState.Fullscreen) {
				// There is mess of messages from electron that becomes in different orders for different OS.
				// because of the activeTab.isFullscreened delay, we need a set timeout to display the correct warning
				activeTab.onceOnBrowserViewCreated(() => {
					setTimeout(() => this.requestFullscreenMode(activeTab), 1);
					activeTab.setBounds(this.computeViewBounds(this.shouldViewFullscreen()));
				});

				this.startHoverTrack();
			}
			else if (state !== WindowState.FullscreenWithPanel) {
				// TVD-159 Removed Fullscreen CloseButton
				// if (process.platform === 'win32') {
				// 	clearInterval(this.mouseListenerTimeout as ReturnType<typeof setTimeout>)
				// 	this.mouseListenerTimeout = false
				// 	this.hideCloseButton()
				// }

				this.hideFullscreenWarningWindow();

				activeTab.onceOnBrowserViewCreated(() => {
					if (this.currentFullscreenMode === FullscreenMode.Html || activeTab.isFullscreened) {
						ignorePromise(this.closeHTMLFullscreen());
					}
					this.currentFullscreenMode = FullscreenMode.None;
					activeTab.setBounds(this.computeViewBounds(false));
				});

				this.stopHoverTrack();
			}

			if (this.windowEventsReceiver) {
				this.windowEventsReceiver.windowStateChanged(state);
			}
		}

		private startHoverTrack(): void {
			// macos titlebar overlays tab panel
			if (!this.supportAreaHover || isDarwin() || this.cursorSubscription) {
				return;
			}

			this.subscribeToPointerCapture();
		}

		private subscribeToPointerCapture(): void {
			if (!this.capturer) {
				return;
			}

			this.cursorSubscription = this.capturer.onMotion().subscribe((data) => {
				if (!windowService().isShowTabsPanelFullscreen) {
					return;
				}

				if (this.windowRef.isDestroyed()) {
					this.stopHoverTrack();
					return;
				}

				if (!this.pointConverter) {
					return;
				}

				const bounds = this.windowRef.getBounds();
				bounds.height = this.getTitleHeight();

				this.topAreaHover(isInBounds(bounds, this.pointConverter.fromMotionEventToScreenPoint(data)));
			});
		}

		private stopHoverTrack(): void {
			this.menuOpenedSub?.unsubscribe();
			this.cursorSubscription?.unsubscribe();
			this.cursorSubscription = undefined;

			if (this.panelDelayedTimeout) {
				clearInterval(this.panelDelayedTimeout);
			}
		}
	}

	return FullscreenableWindow;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FullscreenableTabbedWindow = Fullscreenable(TabbedWindowBase);
