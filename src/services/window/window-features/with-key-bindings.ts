import { app } from 'electron';
import i18next from 'i18next';

import { loggerService } from '../../../logger';
import { ignorePromise, isDarwin, isSnapshotUrl } from '../../../utils';
import { bindHotkeyCommand } from '../../../utils/hotkey-service';
import { getConfiguration } from '../../configuration';
import { mainService } from '../../main-service';
import { TabbedWindowBase } from '../tabbed-window';
import { windowService } from '..';
import { WindowMixin } from './window-mixin';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/naming-convention
export function WithKeyBindings<T extends WindowMixin<TabbedWindowBase>>(Base: T) {
	class WndWithKeyBindings extends Base {
		@bindHotkeyCommand('zoom-in')
		private zoomIn(): void {
			ignorePromise(windowService().zoom('+'));
		}

		@bindHotkeyCommand('zoom-out')
		private zoomOut(): void {
			ignorePromise(windowService().zoom('-'));
		}

		@bindHotkeyCommand('set-zoom-default')
		private setZoomDefault(): void {
			ignorePromise(windowService().zoom(1));
		}

		@bindHotkeyCommand('new-window')
		private newWindow(): void {
			windowService().newWindow();
		}

		@bindHotkeyCommand('next-tab')
		@bindHotkeyCommand('next-tab-darwin', { pred: () => { return isDarwin(); } })
		private nextTab(): void {
			this.setNextTab(+1);
		}

		@bindHotkeyCommand('prev-tab')
		@bindHotkeyCommand('prev-tab-darwin', { pred: () => { return isDarwin(); } })
		private prevTab(): void {
			this.setNextTab(-1);
		}

		@bindHotkeyCommand('new-tab')
		private newTab(): void {
			this.createAndAddTab({})
				.catch((error) => {
					loggerService().error('WithKeyBindings.newTab(): this.createAndAddTab() error', error);
				});
		}

		@bindHotkeyCommand('reopen-tab')
		private reopenTab(): void {
			mainService().undo.undo();
			const countWindows = windowService().getCountWindows();
			windowService().chartWindowSubject.next(countWindows);
		}

		@bindHotkeyCommand('close-tab')
		private closeTabCommand(): void {
			const tab = this.getCurrentTab();
			if (tab) {
				this.closeTab(tab.id)
					.catch((error) => {
						loggerService().error('WithKeyBindings.closeTabCommand(): this.closeTab() error', error);
					});
			}
		}

		@bindHotkeyCommand('exit-darwin', { pred: () => { return isDarwin(); } })
		private exitDarwin(): void {
			this.exit();
		}

		@bindHotkeyCommand('exit')
		private exit(): void {
			app.quit();
		}

		@bindHotkeyCommand('reload-tab')
		@bindHotkeyCommand('reload-tab-no-darwin', { pred: () => { return !isDarwin(); } })
		private reloadTabCommand(): void {
			const tab = this.getCurrentTab();
			if (tab) {
				this.reloadTab(tab.id);
			}
		}

		@bindHotkeyCommand('duplicate-tab')
		private duplicateTabCommand(): void {
			const tab = this.getCurrentTab();
			if (tab) {
				ignorePromise(this.duplicateTab(tab.id));
			}
		}

		@bindHotkeyCommand('save-snapshot')
		private saveSnapshot(): void {
			const tab = this.getCurrentTab();
			if (tab && tab.url && isSnapshotUrl(tab.url)) {
				tab.downloadURL(tab.url);
			}
		}

		@bindHotkeyCommand('set-specific-tab', { sendKey: true })
		private setSpefificTab(key: string): void {
			const digit = parseInt(key, 10);

			const activeTab = this.tabs[digit - 1];

			if (!activeTab) {
				return;
			}

			this.setActiveTab(activeTab);
		}

		@bindHotkeyCommand('set-last-tab')
		private setLastTab(): void {
			const activeTab = this.tabs[this.tabs.length - 1];

			if (!activeTab) {
				return;
			}

			this.setActiveTab(activeTab);
		}

		@bindHotkeyCommand('show-wnd-dev-tools', { pred: () => { return mainService().isDebugMode(); } })
		private showDevToolsCommand(): void {
			this.showDevTools();
		}

		@bindHotkeyCommand('show-tab-dev-tools', { pred: () => { return mainService().isDebugMode(); } })
		private showDevToolsDetachedCommand(): void {
			const tab = this.getCurrentTab();
			if (tab) {
				tab.openDevTools(this.windowRef.resizable ? undefined : { mode: 'detach' });
			}
		}

		@bindHotkeyCommand('open-help-center')
		private openHelpCenter(): void {
			if (isDarwin()) {
				return;
			}
			const domain = getConfiguration().urls.defaultHost;
			void this.createAndAddTab({ title: i18next.t('Help Center and Support'), url: `${ domain }support/folders/43000574972-features-and-configuration/` });
		}
	}

	return WndWithKeyBindings;
}
