import { app, BrowserWindow, Rectangle } from 'electron';
import path from 'path';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { enable } from '@electron/remote/main';

import { Promisify } from '../../../ipc-remote';
import { IpcServices } from '../../../ipc-services';
import { loggerService } from '../../../logger';
import { logCall } from '../../../logger/log-decorator';
import { Disposable } from '../../../tvd-runtime/core';
import { appEventService } from '../../app-event-service';
import { Dimensions } from '../../interfaces';
import { localeService } from '../../locale';
import { mainService } from '../../main-service';
import { themeManager } from '../../settings/theme';
import { IToastView, IToastWindow, ToastAttachPosition, ToastData, ToastWindowLevel, ToastWindowOptions } from '.';

const TOAST_WINDOW_REMOTE_CONTRACT = 'tvd:toast-window';

export class ToastWindow implements Disposable, IToastWindow {
	private width = 0;
	private height = 0;

	readonly remoteServiceInstanceId: string = IpcServices.registerRemoteObject(this, TOAST_WINDOW_REMOTE_CONTRACT);

	private themeChangeSubscription: Subscription;
	private appEventServiceSubscription: Subscription;
	private localeSubscription?: Subscription;

	private windowRef: BrowserWindow;
	private dimensionsCalcService?: Promisify<IToastView>;

	private dimensionsCalcReadyResolver?: () => void;

	constructor({
		windowOptions = {},
		isDisposeToastOnLocaleChange = true,
		shouldEnableRemote = false,
	}: ToastWindowOptions) {
		loggerService().debug(`Initializing ToastWindow id ${ this.remoteServiceInstanceId }`);

		this.windowRef = new BrowserWindow({
			width: 800,
			height: 600,
			resizable: false,
			focusable: false,
			fullscreenable: false,
			maximizable: false,
			minimizable: false,
			closable: false,
			transparent: true,
			frame: false,
			show: false,
			hasShadow: false,
			webPreferences: {
				devTools: mainService().isDebugMode(),
				backgroundThrottling: false,
				contextIsolation: false,
				nodeIntegration: true,
			},
			...windowOptions,
		});
		if (shouldEnableRemote) {
			enable(this.windowRef.webContents);
		}

		this.themeChangeSubscription = themeManager().themeChange.subscribe(() => themeManager().applyTheme(this.windowRef.webContents));
		this.appEventServiceSubscription = appEventService().shutdown.subscribe(() => this.dispose());

		// Fires on explicit destroy() and when the parent window closes (child cascade),
		// so subscriptions are always released regardless of who destroys the window.
		this.windowRef.on('closed', () => this.unsubscribeAll());

		if (!isDisposeToastOnLocaleChange) {
			return;
		}

		this.localeSubscription = localeService().localeChange.pipe(skip(1)).subscribe(() => this.dispose());
	}

	async loadToast(toast: ToastData): Promise<void> {
		loggerService().debug(`ToastWindow.loadToast(toast: ${ toast.rendererType })`);

		const rendererData = {
			remoteServiceInstanceId: this.remoteServiceInstanceId,
			isRtl: localeService().isRtl(),
			toast,
		};

		const rendererLoadOptions = {
			query: { rendererInitialData: JSON.stringify(rendererData) },
		};

		const toastRenderPath: string = path.join(app.getAppPath(), 'app/toast', 'index.html');

		await this.windowRef.loadFile(toastRenderPath, rendererLoadOptions);

		await this.awaitDimensionsCalcReady();

		if (!this.dimensionsCalcService) {
			return;
		}

		const dimensions = await this.dimensionsCalcService.getToastViewDimensions();

		this.setToastSize(dimensions);
	}

	private awaitDimensionsCalcReady(): Promise<void> {
		return new Promise((resolve) => {
			this.dimensionsCalcReadyResolver = resolve;
		});
	}

	registerDimensionsCalcView(id: string): void {
		loggerService().debug(`ToastWindow.registerDimensionsCalcView(id: ${ id })`);

		this.dimensionsCalcService = IpcServices.provideProxy<IToastView>(id, this.windowRef.webContents.id);

		loggerService().debug(`[Renderer] Toast view id: ${ id }`);

		if (this.dimensionsCalcReadyResolver) {
			this.dimensionsCalcReadyResolver();
		}
	}

	attachToWindow(wnd: BrowserWindow, position: ToastAttachPosition): void {
		loggerService().debug(`ToastWindow.attachToWindow(wnd: ${ wnd.id }, position: ${ position })`);

		if (this.windowRef.isDestroyed() || wnd.isDestroyed()) {
			return;
		}

		this.windowRef.setParentWindow(wnd);

		const topMargin = 90;
		const bottomMargin = 12;
		const parentBounds = wnd.getBounds();
		const y = position === 'top'
			? parentBounds.y + topMargin
			: parentBounds.y + parentBounds.height - this.height - bottomMargin;

		const toastBounds: Rectangle = {
			x: Math.round(parentBounds.x + parentBounds.width / 2 - this.width / 2),
			y: Math.round(y),
			width: this.width,
			height: this.height,
		};

		this.windowRef.setBounds(toastBounds);
		// does not position toast correctly at the first time due to dpi awareness
		this.windowRef.setBounds(toastBounds);
	}

	@logCall
	detachFromWindow(): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}

		this.windowRef.setParentWindow(null);
	}

	setAlwaysOnTop(flag: boolean, level?: ToastWindowLevel, relativeLevel?: number): void {
		loggerService().debug(`ToastWindow.setAlwaysOnTop(flag: ${ flag }, ${ level ? `level: ${ level }` : '' }, ${ relativeLevel ? `relativeLevel: ${ relativeLevel }` : '' }})`);

		try {
			this.windowRef.setAlwaysOnTop(flag, level, relativeLevel);
		}
		catch (error) {
			loggerService().error(`ToastWindow id: ${ this.windowRef.id }.setAlwaysOnTop`, error);
		}
	}

	setParentWindow(wnd: BrowserWindow): void {
		loggerService().debug(`ToastWindow.setParentWindow(wnd: ${ wnd.id })`);

		if (this.windowRef.isDestroyed() || wnd.isDestroyed()) {
			return;
		}

		this.windowRef.setParentWindow(wnd);
	}

	setToastSize({ width, height }: Dimensions): void {
		loggerService().debug(`ToastWindow.setToastSizes(dimensions: { width: ${ width }, height: ${ height })`);

		if (this.windowRef.isDestroyed()) {
			return;
		}

		this.width = width;
		this.height = height;

		// double rerender of window bounds for correct toast HTML page bounds on window scale
		this.windowRef.setBounds({
			width: width + 1,
			height: height + 1,
		});

		this.windowRef.setBounds({
			width,
			height,
		});
	}

	async show(wnd: BrowserWindow): Promise<void> {
		loggerService().debug(`ToastWindow.show(wnd: ${ wnd.id })`);

		if (this.windowRef.isDestroyed() || wnd.isDestroyed() || !this.dimensionsCalcService) {
			return;
		}

		const dimensions = await this.dimensionsCalcService.getToastViewDimensions();

		if (this.windowRef.isDestroyed() || wnd.isDestroyed()) {
			return;
		}

		this.setToastSize(dimensions);
		this.windowRef.show();
		this.windowRef.moveAbove(wnd.getMediaSourceId());
	}

	hide(): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}
		this.windowRef.hide();
	}

	isDestroyed(): boolean {
		return this.windowRef.isDestroyed();
	}

	isLoaded(): boolean {
		return !!this.windowRef.webContents.getURL();
	}

	@logCall
	dispose(): void {
		// `destroy()` emits 'closed', whose handler releases the subscriptions.
		if (!this.windowRef.isDestroyed()) {
			this.windowRef.destroy();
		}
	}

	private unsubscribeAll(): void {
		this.themeChangeSubscription.unsubscribe();
		this.appEventServiceSubscription.unsubscribe();
		this.localeSubscription?.unsubscribe();
	}
}
