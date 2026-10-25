import { BehaviorSubject } from 'rxjs';

import { logCall, logCallName } from '../../logger/log-decorator';
import { isLocalURI } from '../../utils';
import { fitInRange } from '../../utils/math';
import { TabbedWindow } from './tabbed-window-imports';
import { ToastRendererType } from './toast';
import { toastService } from './toast-service';
import { ZoomDirection } from './window-api';
import { windowService } from '.';

@logCallName('ZoomController')
export class ZoomController {
	private readonly zoomChangeEvent = new BehaviorSubject<number>(1);
	readonly zoomChange = this.zoomChangeEvent.asObservable();

	private readonly zoomStep = 0.1;

	@logCall
	async showZoom(): Promise<void> {
		const focusedWnd = windowService().getLastFocusedWindow();

		if (!focusedWnd) {
			return;
		}

		const viewUrl = focusedWnd.activeTab?.getURL();
		if (viewUrl && isLocalURI(viewUrl)) {
			return;
		}

		await toastService().show({ rendererType: ToastRendererType.Zoom }, focusedWnd.windowRef);
	}

	@logCall
	private setZoomToView(wnd: TabbedWindow, zoomStep: number): number | undefined {
		const activeTab = wnd.activeTab;

		if (!activeTab) {
			return;
		}
		const zoomFactor = activeTab.zoomFactor();

		if (!zoomFactor) {
			return;
		}

		const viewUrl = activeTab.getURL();

		if (!viewUrl) {
			return;
		}

		if (isLocalURI(viewUrl)) {
			activeTab.setZoomFactor(1);
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const zoomChange = zoomStep * 10;

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const zoomNext = Math.round(zoomFactor * 10 + zoomChange) / 10;

		const minZoomValue = 0.2;
		const maxZoomValue = 5;

		const limited = fitInRange(zoomNext, maxZoomValue, minZoomValue);

		this.zoomChangeEvent.next(limited);
		activeTab.setZoomFactor(limited);
		return limited;
	}

	@logCall
	setZoomValue(zoom: number): void {
		for (const wnd of windowService().getChartWindows()) {
			if (wnd.windowRef.isDestroyed() || !wnd.windowRef.isFocused()) {
				continue;
			}

			const activeTab = wnd.activeTab;
			if (!activeTab) {
				continue;
			}

			let zoomToView = zoom;

			activeTab.onceOnBrowserViewCreated(() => {
				const viewUrl = activeTab.getURL();
				if (viewUrl && isLocalURI(viewUrl)) {
					zoomToView = 1;
				}
				activeTab.setZoomFactor(zoomToView);
			});

			this.zoomChangeEvent.next(zoomToView);
		}
	}

	@logCall
	stepZoom(direction: ZoomDirection): number | undefined {
		const step = direction === '+' ? this.zoomStep : -this.zoomStep;
		const wnd = windowService().getLastFocusedWindow();
		if (wnd && !wnd.windowRef.isDestroyed()) {
			return this.setZoomToView(wnd, step);
		}
	}

	getZoomValue(): number {
		return this.zoomChangeEvent.value;
	}
}
