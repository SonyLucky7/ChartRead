import { app, BrowserWindow, BrowserWindowConstructorOptions, Event, screen } from 'electron';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { enable } from '@electron/remote/main';

import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyUrl } from '../../logger/log-formatter';
import { setWindowPlacement, ShowWindow } from '../../native';
import { performanceService } from '../../performance';
import { IPersistentObject, IPersistentObjectImplementation, PersistentObject } from '../../persistence';
import { SequenceSynchronizer } from '../../sequence-synchronizer/sequence-synchronizer';
import { Disposable, getMessageOfError } from '../../tvd-runtime/core';
import { dispatchBeforeUnload, isDarwin, isLinux, isWin32, Position, Rectangle } from '../../utils';
import { appEventService } from '../app-event-service';
import { TIMEOUT_ENTER_FULLSCREEN_WIN } from '../interfaces';
import { themeManager } from '../settings/theme';
import { waitViewReady } from './wait-view-ready';
import { WindowState } from './window-api';
import { getNativeWindowHandleInt32 } from './window-native';
import { WithListener } from './with-listener';
import { windowService } from '.';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StatefulWindow extends IPersistentObject { }

const enum WindowCloseState {
	Opened = 'Opened',
	Closing = 'Closing',
	Closed = 'Closed',
}

@PersistentObject
@logCallName('StatefulWindow')
export class StatefulWindow extends WithListener implements IPersistentObjectImplementation, Disposable {
	static readonly onWindowClosedSubject = new Subject<StatefulWindow>();
	private static readonly closeGuard: SequenceSynchronizer<StatefulWindow> = new SequenceSynchronizer(StatefulWindow.closeGuardCallback);

	private readonly onWindowStateChangedSubject = new Subject<WindowState>();
	private url: string;
	private loadInternal: Promise<void> | null = null;
	private readyState = false;
	private closeState = WindowCloseState.Opened;
	private readonly disposables: Array<Disposable | Subscription> = [];
	private windowState = WindowState.Normal;

	protected postLoadResolver: (() => void) | undefined;

	readonly windowRef: BrowserWindow;
	readonly windowStateChanged = this.onWindowStateChangedSubject.asObservable();

	private readonly resizeSubject = new Subject<void>();
	private readonly resizeDelay = 10;

	private countOfFailedToLoad = 0;
	private readonly limitOfMaxLoadAttempts = 10;

	private appReadyAwaiter: Promise<void> | undefined;
	protected appReady = false;

	protected supportAreaHover = false;

	@logCall
	static getBaseWindow(browserWindow: BrowserWindow | null): StatefulWindow | null {
		if (!browserWindow || !('_baseWindow' in browserWindow)) {
			return null;
		}

		return Reflect.get(browserWindow, '_baseWindow') as StatefulWindow;
	}

	static async closeGuardCallback(windows: Set<StatefulWindow>): Promise<void> {
		const windowsCount = windowService().getCountWindows();
		// non-strict inequality because of logger window which can be enqueued but is ignored by getCountWindows()
		if (windowsCount <= windows.size) {
			app.quit();
			return;
		}

		for (const window of windows) {
			if (window.windowRef.isDestroyed() || !window.windowRef.isClosable()) {
				StatefulWindow.onWindowClosedSubject.next(window);
				return;
			}

			const closed = await window.processClose();

			if (!closed) {
				return;
			}

			window.dispose();
			StatefulWindow.onWindowClosedSubject.next(window);
		}
	}

	static get windowClosed(): Observable<StatefulWindow> {
		return StatefulWindow.onWindowClosedSubject.asObservable();
	}

	constructor(options: BrowserWindowConstructorOptions, url: string) {
		super();
		this.windowRef = new BrowserWindow(options);

		this.windowRef.setMenu(null);

		if (isWin32() && options.x !== undefined && options.y !== undefined &&
			options.height !== undefined && options.width !== undefined) {
			this.windowRef.setBounds({ x: options.x, y: options.y, height: options.height, width: options.width });
		}

		Object.defineProperty(this.windowRef, '_baseWindow', {
			value: this,
			configurable: true,
		});

		this.url = url;

		this.addDisposable(
			this.resizeSubject
				.pipe(debounceTime(this.resizeDelay))
				.subscribe(() => {
					this.changeWindowState();
				})
		);

		this.addDisposable(
			themeManager().themeChange.subscribe(() => {
				this.applyWindowTheme();
			})
		);

		this.windowRef
			.on('maximize', () => this.changeWindowState())
			.on('unmaximize', () => this.changeWindowState())
			.on('minimize', () => this.changeWindowState())
			.on('restore', () => this.changeWindowState())
			.on('resize', () => {
				if (isLinux()) {
					// linux:
					// when window is maximized 'resize' event is raised (not 'maximize'), but content bounds still not changed,
					// so any consequent computation that rely on it will be broken.
					const cbounds = this.windowRef.getContentBounds();
					const bounds = this.windowRef.getBounds();
					if (cbounds.width !== bounds.width || cbounds.height !== bounds.height) {
						this.resizeSubject.next();
						return;
					}
				}

				this.resizeSubject.next();
			})
			.on('show', () => this.changeWindowState())
			.on('enter-html-full-screen', () => this.changeWindowState())
			.on('leave-html-full-screen', () => this.changeWindowState())
			.on('hide', () => this.changeWindowState())
			.on('close', this.onWindowClose.bind(this));

		this.windowRef.on('enter-full-screen', () => {
			// linux receives too many events for enter full screen
			if (isLinux()) {
				const state = this.getWindowState();

				if (state === WindowState.Fullscreen || state === WindowState.FullscreenWithPanel) {
					return;
				}
			}

			this.onWindowStateChangedSubject.next(this.getWindowState());
		});

		this.windowRef.on('leave-full-screen', () => {
			// WARN: on linux 'leave-full-screen' emited to often even if there is no full screen (on focus for example).
			// On .rpm based linux event 'leave-full-screen' emited infinite number of times
			// Don't known currently what do (how ignore or fix that)

			if (isLinux()) {
				const state = this.getWindowState();

				if (state !== WindowState.Fullscreen && state !== WindowState.FullscreenWithPanel) {
					return;
				}
			}

			if (isDarwin()) {
				this.onWindowStateChangedSubject.next(this.getWindowState());
				return;
			}

			// without setTimeout there is wrong state on windowsOS
			setTimeout(() => {
				if (!this.windowRef.isDestroyed()) { // when window is closed on linux there is always access to the destroyed window (because of see WARN above).
					this.onWindowStateChangedSubject.next(this.getWindowState());
				}
			}, TIMEOUT_ENTER_FULLSCREEN_WIN);
		});

		this.windowRef.webContents.on('did-start-loading', () => {
			this.createAppAwaiter();
			this.onStartLoad();
		});

		this.windowRef.webContents.on('did-fail-load', () => {
			void this.postLoad();
		});

		this.windowRef.webContents.on('did-finish-load', () => {
			void this.postLoad();
		});

		enable(this.windowRef.webContents);
	}

	protected changeWindowState(): void {
		this.onWindowStateChangedSubject.next(this.getWindowState());
		// StatefulWindow.onAnyWindowStateChangedSubject.next(this);
	}

	protected onWindowClose(ev: Event): void {
		if (appEventService().isClosing() || this.isClosing || this.isClosed) {
			return;
		}

		ev.preventDefault();
		StatefulWindow.closeGuard.sync(this);
	}

	@logCall
	private async preloadDefaultPage(): Promise<void> {
		const theme = themeManager().getPlatformTheme();
		const bgColor = theme === 'light' ? '#FFF' : '#2a2e39';
		const headerColor = theme === 'light' ? '#E0E3EB' : bgColor;
		const separatorBgColor = theme === 'light' ? '#FFF' : '#131722';

		try {
			await this.windowRef.loadURL('data:text/html;charset=utf-8,' +
				encodeURIComponent(`<head>
			<style>
				body{margin:0; background:${ bgColor };}
				.preview-header{background:${ headerColor };width:100%;height:34px;}
				.preview-separator { border-bottom: 1px solid ${ headerColor }; box-sizing: border-box; background: ${ separatorBgColor }; width: 100%; height: 4px; }
			</style></head>
			<body><div class="preview-header"></div><div class="preview-separator"></div></body>`));
		}
		catch (err) {
			loggerService().error('Failed to load default page', err);
		}
	}

	@logCall
	private async processClose(): Promise<boolean> {
		if (!windowService().mayClose()) {
			return false;
		}

		if (this.closeState !== WindowCloseState.Opened) {
			return false;
		}

		this.closeState = WindowCloseState.Closing;

		// This need to implicitly raise beforeunload, because there is no other opportunity no notify renderer side about window unloading.
		// (in other case we need ipc events and electron integration).
		const notifyContentUnloaded = async(): Promise<void> => {
			if (this.windowRef.isDestroyed()) {
				return;
			}

			await this.windowRef.webContents.executeJavaScript(`(${ dispatchBeforeUnload.toString() })();`);
		};

		try {
			const allowToBeClosed = this.willCloseWindow();

			if (!(allowToBeClosed instanceof Promise)) {
				if (typeof allowToBeClosed !== 'boolean') {
					loggerService().error('[StatefulWindow.processClose()] Expected boolean or Promise<boolean>');
				}

				this.closeState = allowToBeClosed ? WindowCloseState.Closed : WindowCloseState.Opened;
			}
			else {
				this.closeState = await allowToBeClosed ? WindowCloseState.Closed : WindowCloseState.Opened;
			}
		}
		catch (error: unknown) {
			const message = getMessageOfError(error);
			loggerService().error(`Error while handle window close: ${ message }`, error);
			this.closeState = WindowCloseState.Closed;
		}
		if (this.isClosed) {
			await notifyContentUnloaded();
		}

		return this.isClosed;
	}

	getWindowState(): WindowState {
		if (this.windowRef.isDestroyed()) {
			return this.windowState;
		}
		// when the isMinimized check is not at the top of the if statements there is incorrect
		// determination of window state on macOS when switching from maximized window to minimized window

		if (this.windowRef.isMinimized()) {
			this.windowState = WindowState.Minimized;
		}

		else if (this.windowRef.isMaximized() && !this.windowRef.isFullScreen()) {
			this.windowState = WindowState.Maximized;
		}

		else if (!this.windowRef.isVisible()) {
			this.windowState = WindowState.Hidden;
		}

		else if (this.windowRef.isFullScreen()) {
			this.windowState = WindowState.Fullscreen;
		}

		else {
			this.windowState = WindowState.Normal;
		}

		return this.windowState;
	}

	get isClosing(): boolean {
		return this.closeState === WindowCloseState.Closing;
	}

	get isClosed(): boolean {
		return this.closeState === WindowCloseState.Closed;
	}

	@logCall
	showDevTools(): void {
		this.windowRef.webContents.openDevTools({ mode: 'detach' });
	}

	@logCall
	load(): Promise<void> {
		if (this.loadInternal) {
			return this.loadInternal;
		}

		this.loadInternal = (async(): Promise<void> => {
			try {
				const evId = performanceService().beginEvent(`StatefulWindow: loading window page, url: '${ shortifyUrl(this.url) }'`);
				let loadOptions: Electron.LoadFileOptions | undefined;
				const rendererData: unknown = this.rendererInitialData;
				if (rendererData) {
					loadOptions = {
						query: { rendererInitialData: JSON.stringify(rendererData) },
					};
				}

				// eslint-disable-next-line no-return-assign
				const postLoadSignal = new Promise<void>((resolve) => this.postLoadResolver = resolve);

				await this.windowRef.loadFile(this.url, loadOptions);
				performanceService().endEvent(evId);

				await postLoadSignal;
				loggerService().info(`Window page loaded, url: '${ shortifyUrl(this.url) }'`);
			}
			catch (err) {
				loggerService().error('Error loading main window', err);
			}
			finally {
				this.readyState = true;
			}
		})();

		return this.loadInternal;
	}

	get isReady(): boolean {
		return this.readyState;
	}

	@logCall
	close(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling close on window that was destroyed');
			return;
		}

		if (!this.windowRef.isClosable()) {
			this.hide();
		}
		else {
			this.windowRef.close();
		}
	}

	@logCall
	show(activate = false): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling show on window that was destroyed');
			return;
		}
		if (!activate) {
			this.windowRef.showInactive();
		}
		else {
			this.windowRef.show();
		}
	}

	@logCall
	moveTop(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling moveTop on window that was destroyed');
			return;
		}
		this.windowRef.moveTop();
	}

	@logCall
	hide(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling hide on window that was destroyed');
			return;
		}
		this.windowRef.hide();
	}

	@logCall
	maximize(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling maximize on window that was destroyed');
			return;
		}
		this.windowRef.maximize();
	}

	/**
	 * @platform Windows
	 */
	@logCall
	unmaximizeNative(): void {
		if (!isWin32()) {
			loggerService().error('Unmaximize native does not have implementation for current platform');
			return;
		}

		const getUnmaximizedBounds = (): Rectangle => {
			const bounds = this.windowRef.getNormalBounds();
			const displayWithWindow = screen.getDisplayMatching(bounds);
			const position: Position = { x: displayWithWindow.bounds.x, y: displayWithWindow.bounds.y };
			const screenPosition = screen.dipToScreenPoint(position);

			return {
				x: screenPosition.x,
				y: screenPosition.y,
				width: bounds.width,
				height: bounds.height,
			};
		};

		try {
			const newBounds = getUnmaximizedBounds();
			const windowHandler = getNativeWindowHandleInt32(this.windowRef);

			setWindowPlacement(windowHandler, newBounds.x, newBounds.y, newBounds.width, newBounds.height, ShowWindow.SW_NORMAL);
		}
		catch (err) {
			loggerService().error('Error at native unmaximize', err);
		}
	}

	@logCall
	applyWindowTheme(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling applyTheme on window that was destroyed');
			return;
		}

		themeManager().applyTheme(this.windowRef.webContents);
	}

	@logCall
	internalExtractState(): unknown {
		return {};
	}

	@logCall
	protected createAppAwaiter(): void {
		if (this.appReadyAwaiter) {
			return;
		}

		this.appReadyAwaiter = new Promise<void>((resolveAppReady): void => {
			if (this.windowRef.isDestroyed() || this.windowRef.webContents.isDestroyed()) {
				loggerService().error(`Error in app ready awaiter for ${ this.url }. Webcontents destroyed before ready`);
				resolveAppReady();
			}

			waitViewReady(this.windowRef.webContents)
				.then(() => {
					this.appReady = true;
					this.resolvePostLoad();

					this.onFinishLoad();

					resolveAppReady();
				})
				.catch((err) => {
					loggerService().error(`[StatefulWindow().createAppAwaiter()]: (${ this.countOfFailedToLoad }) Error in app ready awaiter for ${ this.url }`, err);
					this.countOfFailedToLoad += 1;

					if (!this.appReady && this.countOfFailedToLoad > this.limitOfMaxLoadAttempts) {
						loggerService().error(
							`[StatefulWindow().createAppAwaiter()]: Exceeded limit of maximum(${ this.limitOfMaxLoadAttempts }) number of load attempts(${ this.countOfFailedToLoad }).
							Url: ${ this.url }`,
							err
						);
						throw err;
					}

					resolveAppReady();
				});
		});
	}

	protected async postLoad(): Promise<void> {
		if (!this.appReadyAwaiter) {
			return;
		}

		await this.appReadyAwaiter;

		if (this.appReady || this.windowRef.isDestroyed()) {
			this.countOfFailedToLoad = 0;
			return;
		}

		loggerService().warn('Window did not start, trying to reload...');

		delete this.appReadyAwaiter;

		this.windowRef.reload();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	internalApplyState(state: unknown): void { }

	protected onStartLoad(): void { }

	protected onFinishLoad(): void { }

	protected resolvePostLoad(): void {
		if (!this.postLoadResolver || !this.appReady) {
			return;
		}

		const resolver = this.postLoadResolver;
		delete this.postLoadResolver;

		resolver();
	}

	protected get rendererInitialData(): unknown {
		return null;
	}

	@logCall
	protected willCloseWindow(): Promise<boolean> | boolean {
		return true;
	}

	@logCall
	protected addDisposable(disposable: Subscription | Disposable): void {
		this.disposables.push(disposable);
	}

	@logCall
	dispose(): void {
		if (!this.windowRef.isDestroyed()) {
			// need, because windowRef.close() can raise corresponding event handler.
			this.closeState = WindowCloseState.Closed;
			this.windowRef.close();
		}

		this.readyState = false;

		this.disposables.forEach(disposable => {
			if (!disposable) {
				return;
			}
			if ('dispose' in disposable) {
				disposable.dispose();
			}
			else {
				disposable.unsubscribe();
			}
		});

		this.disposables.splice(0, this.disposables.length);
	}
}
