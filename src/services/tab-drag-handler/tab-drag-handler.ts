import { screen } from 'electron';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId } from '../../logger/log-formatter';
import { TabId, tabManager } from '../../main/tab-manager';
import { addBreadcrumb } from '../../sentry/main';
import { areEqual, ignorePromise, isDarwin, isInBounds, isWin32, Position, Rectangle } from '../../utils';
import { DARWIN_CONTROLS_WIDTH, darwinOffset } from '../interfaces';
import { dragServiceProxy } from '../native-drag-service';
import { configureDragService, isDragServiceReady } from '../native-drag-service/native-drag-configuration';
import { authenticatedFeature } from '../user/profeature';
import { NewWindowInfo, windowService } from '../window';
import { getDefaultTabbedWindowOptions, TabbedWindow } from '../window/tabbed-window-imports';
import { ControlsAreaWidth, WINDOW_HEADER_HEIGHT, WindowState } from '../window/window-api';
import { TabbedWindowOptions } from '../window/window-options';
import { IDragHandler, ITabDragHandler, TAB_DRAG_HANDLER_CONTRACT } from './itab-drag-service';

@ExposeSingletonService(TAB_DRAG_HANDLER_CONTRACT, IpcServices.getProvider())
@logCallName('TabDragHandler')
export class TabDragHandler implements IDragHandler, ITabDragHandler {
	private tempWindows: TabbedWindow[] = [];

	private tempTabId: TabId | null = null;
	private tempWndBounds?: Rectangle;
	private tempWindowMoveInterval?: number;

	private prevPosition?: Position;
	private initialRelativePoint?: Position;
	private tabParentBounds?: Rectangle;

	constructor() {
		loggerService().debug('Initializing TabDragHandler');
		configureDragService();
	}

	@logCall
	handleDragStart(): void { }

	public async handleDragEnd(): Promise<void> {
		if (!isDragServiceReady()) {
			return;
		}

		const [tempWnd] = this.tempWindows;

		loggerService().info('End drag tab');

		if (!tempWnd || tempWnd.windowRef.isDestroyed()) {
			await this.resetTempWindow();
			return;
		}

		const tempTab = this.tempTabId !== null ? tabManager().getTab(this.tempTabId) : null;
		if (tempTab !== null) {
			tempTab.offset = undefined;
			tempTab.width = undefined;
		}

		tempWnd.allowMouseEvents = true;

		tempWnd.windowRef.setAlwaysOnTop(false);
		this.resetWindow(tempWnd);
	}

	@logCall
	public async startWindowDrag(windowId: string, tabId: string, point: Position): Promise<void> {
		const window = windowService().findWindow({ windowId });
		if (window === undefined) {
			loggerService().error(`TabDragHandler.startWindowDrag: window with id ${ shortifyId(windowId) } was not found on window move`);
			return;
		}

		const tab = window.findTabById(tabId);
		if (tab === null) {
			loggerService().error(`TabDragHandler.startWindowDrag: tab with id ${ shortifyId(tabId) } was not found on window move`);
			return;
		}

		this.tempTabId = tab.id;

		const maximizeTempWindow = (): void => {
			loggerService().debug('TabDragHandler.startWindowDrag: window is maximized, will normalize it');

			if (isWin32()) {
				window.unmaximizeNative();
				return;
			}

			window.windowRef.unmaximize();
		};

		if (window.windowRef.isMaximized()) {
			maximizeTempWindow();
		}

		const screenPosition = await this.getScreenPosition();

		if (!screenPosition) {
			return;
		}

		this.initialRelativePoint = point;
		const { x, y, width, height } = window.windowRef.getNormalBounds();

		await this.setOrCreateTempWindow(x, y, width, height, window);
	}

	@authenticatedFeature
	public async dragTabOut(windowId: string, tabId: string, position: Position, tabWidth?: number, controlsWidth?: ControlsAreaWidth): Promise<void> {
		const window = windowService().findWindow({ windowId });
		if (window === undefined) {
			loggerService().error(`TabDragHandler.dragTabOut: window ${ shortifyId(windowId) } was not found`);
			return;
		}

		if (window.getWindowState() === WindowState.Fullscreen && !isDarwin()) {
			loggerService().warn(`TabDragHandler.dragTabOut: impossible to detach tab from fullscreened window ${ windowId }`);
			return;
		}

		const detachedTabId = this.detachTab(window, tabId, windowId);
		if (detachedTabId === null) {
			return;
		}

		const tab = tabManager().getTab(detachedTabId);
		if (tab === null) {
			loggerService().error(`TabDragHandler.dragTabOut: detached tab ${ shortifyId(detachedTabId) } was not found in TabManager`);
			return;
		}

		loggerService().info(`TabDragHandler.dragTabOut: tab ${ shortifyId(tab.remoteServiceInstanceId) } was dragged out from window`);

		this.tempTabId = tab.id;
		this.tabParentBounds = window.windowRef.getBounds();

		if (tabWidth !== undefined) {
			const offset = position.x - tabWidth / 2 - darwinOffset;
			const normalizedDarwinTabOffset = Math.max(offset, DARWIN_CONTROLS_WIDTH);
			tab.offset = isDarwin() ? normalizedDarwinTabOffset : offset;
		}

		tab.width = tabWidth;

		const screenPosition = await this.getScreenPosition();
		if (screenPosition === undefined) {
			return;
		}

		// center the cursor on y axis no matter what the position was on detach
		position.y = Math.floor(WINDOW_HEADER_HEIGHT / 2);
		this.initialRelativePoint = position;

		const newX = Math.round(screenPosition.x - position.x);
		const newY = Math.round(screenPosition.y - position.y);
		const { width, height } = window.windowRef.getNormalBounds();

		ignorePromise(
			this.setOrCreateTempWindow(newX, newY, width, height, undefined, controlsWidth)
		);
	}

	@logCall
	public async dragTabIn(windowId: string, tabIndex: number, tabOffset?: number): Promise<void> {
		const [tempWnd] = this.tempWindows;

		const tabId = tempWnd?.tabs[0]?.id ?? this.tempTabId;
		if (tabId === undefined || tabId === null) {
			loggerService().error('TabDragHandler.dragTabIn: no tab id for dragged tab');
			return;
		}

		try {
			const targetWindow = windowService().findWindow({ windowId });
			if (targetWindow === undefined) {
				loggerService().error(`TabDragHandler.dragTabIn: window ${ shortifyId(windowId) } was not found`);
				return;
			}

			if (tempWnd) {
				const tab = tempWnd.findTabById(tabId);
				if (tab === null) {
					loggerService().warn(`TabDragHandler.dragTabIn: tab ${ shortifyId(tabId) } was not found in temp window`);
					return;
				}

				tab.offset = tabOffset;

				await windowService().changeTabParent(tempWnd, targetWindow, tabId, tabIndex);

				return;
			}

			const tempTab = tabManager().getTab(tabId);
			if (tempTab === null) {
				return;
			}

			if (tempTab.offset !== undefined && tempTab.width !== undefined) {
				tempTab.offset = tabOffset;
				tempTab.width = undefined;
			}

			await targetWindow.acceptExistingTab(tabId, tabIndex);
		}
		catch (err) {
			loggerService().error('TabDragHandler.dragTabIn: failed to drag tab in', err);
		}
		finally {
			this.resetState();
		}
	}

	private async snapToCursor(wnd: TabbedWindow | undefined): Promise<void> {
		if (wnd === undefined || wnd.windowRef.isDestroyed() || !this.tempWndBounds || !isDragServiceReady()) {
			return;
		}

		const cursorPosition: Position | undefined = isDarwin()
			? screen.getCursorScreenPoint()
			: await dragServiceProxy().getCursorPosition();

		const isInDrag = await dragServiceProxy().getIsInDrag();
		const isPrevAndCursorPositionsEqual = (): boolean => {
			if (!this.prevPosition || !cursorPosition) {
				return false;
			}

			return areEqual(this.prevPosition, cursorPosition, 2);
		};

		if (
			!isInDrag ||
			cursorPosition === undefined ||
			!this.initialRelativePoint ||
			isPrevAndCursorPositionsEqual()
		) {
			return;
		}

		let x: number;
		let y: number;

		if (!this.prevPosition || !isInBounds(this.getGlobalBounds(this.tempWndBounds, this.initialRelativePoint), cursorPosition)) {
			x = cursorPosition.x - this.initialRelativePoint.x;
			y = cursorPosition.y - this.initialRelativePoint.y;
		}
		else {
			x = this.tempWndBounds.x - (this.prevPosition.x - cursorPosition.x);
			y = this.tempWndBounds.y - (this.prevPosition.y - cursorPosition.y);
		}

		const newPosition = this.normalizeBoundaries({ x, y });

		if (!newPosition.x || !newPosition.y) {
			return;
		}

		try {
			if (wnd.windowRef.isDestroyed()) {
				return;
			}
			wnd.windowRef.setPosition(newPosition.x, newPosition.y, false);
		}
		catch (err) {
			const errorMessage = `Wrong input of position point coordinates: x: ${ newPosition.x }, y: ${ newPosition.y }`;
			addBreadcrumb({ level: 'error', breadcrumb: errorMessage });

			throw err;
		}

		// If size is not set after position change, electron will slowly grow window's height and width by 1 px
		// https://github.com/electron/electron/issues/13043
		wnd.windowRef.setSize(this.tempWndBounds.width, this.tempWndBounds.height, false);

		this.tempWndBounds.x = newPosition.x;
		this.tempWndBounds.y = newPosition.y;
		this.prevPosition = cursorPosition;
	}

	private async setOrCreateTempWindow(x: number, y: number, width: number, height: number, window?: TabbedWindow, controlsWidth?: ControlsAreaWidth): Promise<void> {
		if (!isDragServiceReady()) {
			return;
		}

		const isInDrag = await dragServiceProxy().getIsInDrag();

		if (this.tempWindows.length > 0 || !isInDrag || this.tempTabId === null) {
			return;
		}

		const tempTab = tabManager().getTab(this.tempTabId);
		if (tempTab === null) {
			return;
		}

		if (window === undefined && !!windowService().findWindow({ tabId: tempTab.id })) {
			loggerService().error('TabDragHandler.setOrCreateTempWindow: trying to add tab that is already attached');
			return;
		}

		if (
			this.initialRelativePoint !== undefined &&
			tempTab.width !== undefined &&
			controlsWidth !== undefined
		) {
			// TODO: use CREATE_NEW_TAB_BUTTON_WIDTH in TVD-2944, the actual button container width is 34px, not 45px
			const newTabButtonWidth = 45;
			const maxInitialX = Math.round(width - tempTab.width / 2 - controlsWidth.rightControlWidth - newTabButtonWidth);
			const minInitialX = Math.round(tempTab.width / 2);

			if (this.initialRelativePoint.x < minInitialX) {
				loggerService().debug('TabDragHandler.setOrCreateTempWindow: the window is created to the left');
				this.initialRelativePoint.x = controlsWidth.leftControlWidth + minInitialX;
				tempTab.offset = 0;
			}
			else if (this.initialRelativePoint.x > maxInitialX) {
				loggerService().debug('TabDragHandler.setOrCreateTempWindow: the window is created to the right');
				this.initialRelativePoint.x = controlsWidth.leftControlWidth + tempTab.width / 2;
				tempTab.offset = 0;
			}
		}

		const makeTempWindowOptions = (): TabbedWindowOptions => {
			const tempWindowOpts = getDefaultTabbedWindowOptions();

			if (!tempWindowOpts.windowOptions) {
				tempWindowOpts.windowOptions = {};
			}

			tempWindowOpts.windowOptions.x = x;
			tempWindowOpts.windowOptions.y = y;
			tempWindowOpts.windowOptions.width = width;
			tempWindowOpts.windowOptions.height = height;
			tempWindowOpts.windowOptions.show = false;

			return tempWindowOpts;
		};

		const setSnapInterval = (): void => {
			if (this.tempWindowMoveInterval !== undefined) {
				return;
			}
			const windowMoveHandler: TimerHandler = () => {
				this.snapToCursor(this.tempWindows[0])
					.catch((error) => {
						loggerService().error('TabDragHandler.setOrCreateTempWindow: snapToCursor() error', error);
					});
			};
			this.tempWindowMoveInterval = setInterval(windowMoveHandler, 2);
		};
		const subscribeOnTempWindowFinishLoading = (wnd: TabbedWindow): void => {
			wnd.windowRef.webContents.on('did-finish-load', () => {
				if (!isDragServiceReady()) {
					return;
				}
				dragServiceProxy().getIsInDrag()
					.then(inDrag => {
						if (inDrag) {
							wnd.show();
							setSnapInterval();
						}
					})
					.catch((error) => {
						loggerService().error('TabDragHandler.setOrCreateTempWindow: dragServiceProxy().getIsInDrag() error', error);
					});
			});
		};

		let wnd = window;
		if (wnd === undefined) {
			const newWindowParams: NewWindowInfo = { tabId: this.tempTabId };

			wnd = windowService().newWindow(newWindowParams, makeTempWindowOptions());

			loggerService().info(`TabDragHandler.setOrCreateTempWindow: create temp window for dragged tab [${ shortifyId(tempTab.remoteServiceInstanceId) }]`);
		}
		else {
			loggerService().info(`TabDragHandler.setOrCreateTempWindow: attach dragged tab [${ shortifyId(tempTab.remoteServiceInstanceId) }] to existing window`);
		}

		wnd.allowMouseEvents = false;

		if (isWin32()) {
			wnd.windowRef.setAlwaysOnTop(true, 'screen-saver');
		}
		else {
			wnd.windowRef.setAlwaysOnTop(true);
		}

		this.tempWindows.push(wnd);

		this.tempWndBounds = { x, y, width, height };

		if (wnd.windowRef.isVisible()) {
			setSnapInterval();
			return;
		}

		subscribeOnTempWindowFinishLoading(wnd);
	}

	private resetWindow(wnd: TabbedWindow): void {
		wnd.resetTabs();
		this.resetState();
		wnd.windowRef.focus();
	}

	@logCall
	private resetState(): void {
		clearInterval(this.tempWindowMoveInterval);
		this.tempWindowMoveInterval = undefined;
		this.tempTabId = null;
		this.tempWindows = [];
		this.tempWndBounds = undefined;
		this.prevPosition = undefined;
		this.tempWndBounds = undefined;
		this.initialRelativePoint = undefined;

		tabManager().disposeOrphanedTabs();
	}

	private async getScreenPosition(): Promise<Position | undefined> {
		if (!isDragServiceReady()) {
			return;
		}

		return isDarwin() ? screen.getCursorScreenPoint() : await dragServiceProxy().getCursorPosition();
	}

	private async resetTempWindow(): Promise<void> {
		if (this.tempTabId === null || !isDragServiceReady()) {
			return;
		}

		loggerService().debug('TabDragHandler.resetTempWindow: have temp tab before getCursorPosition method call');

		const cursorPosition = await dragServiceProxy().getCursorPosition();
		if (cursorPosition === undefined) {
			loggerService().warn('TabDragHandler.resetTempWindow: no cursor position on drag end');
			return;
		}

		const tempTab = tabManager().getTab(this.tempTabId);
		if (tempTab === null) {
			return;
		}

		loggerService().debug('TabDragHandler.resetTempWindow: have temp tab after getCursorPosition method call');

		tempTab.offset = undefined;
		tempTab.width = undefined;

		const existingWnd = windowService().findWindow({ tabId: tempTab.id });

		const createTempWindowOptions: () => TabbedWindowOptions = () => {
			const tempWindowOptions = getDefaultTabbedWindowOptions();

			if (!tempWindowOptions.windowOptions) {
				tempWindowOptions.windowOptions = {};
			}

			tempWindowOptions.windowOptions.x = cursorPosition.x;
			tempWindowOptions.windowOptions.y = cursorPosition.y;
			tempWindowOptions.windowOptions.width = this.tabParentBounds?.width;
			tempWindowOptions.windowOptions.height = this.tabParentBounds?.height;

			return tempWindowOptions;
		};

		const newWindowParams: NewWindowInfo = { tabId: this.tempTabId };

		const wnd = existingWnd ?? windowService().newWindow(newWindowParams, createTempWindowOptions());

		this.resetWindow(wnd);
	}

	private detachTab(window: TabbedWindow, tabId: string, windowId: string): string | null {
		try {
			return window.detachTab(tabId);
		}
		catch (err: unknown) {
			loggerService().error(`TabDragHandler.detachTab: failed to detach tab ${ shortifyId(tabId) } from window ${ shortifyId(windowId) }`, err);
			return null;
		}
	}

	private normalizeBoundaries = (point: Position): Position => {
		const display = screen.getDisplayNearestPoint(point);
		const normalizedPointer = { ...point };

		if (normalizedPointer.x < display.bounds.x) {
			normalizedPointer.x = display.bounds.x;
		}

		if (normalizedPointer.y < display.bounds.y) {
			normalizedPointer.y = display.bounds.y;
		}

		normalizedPointer.x = Math.round(normalizedPointer.x);
		normalizedPointer.y = Math.round(normalizedPointer.y);

		return normalizedPointer;
	};

	private getGlobalBounds = (rect: Rectangle, initialPoint: Position): Rectangle => {
		const rectSide = 10;

		return {
			x: rect.x + (initialPoint.x - rectSide / 2),
			y: rect.y + (initialPoint.y - rectSide / 2),
			height: initialPoint.y + rectSide,
			width: initialPoint.x + rectSide,
		};
	};
}
