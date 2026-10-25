import { app, BrowserView, BrowserWindow, Display, Event, Input, screen } from 'electron';
import { join } from 'path';
import { Observable, Subscription } from 'rxjs';

import { IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId } from '../../logger/log-formatter';
import { DialogNavigationHandler } from '../../navigation/dialog-navigation-handler';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { getMessageOfError } from '../../tvd-runtime/core';
import { centeredRect, InputProcessor, isDarwin, isLinux, isWin32, Rectangle } from '../../utils';
import { bindHotkeyCommand } from '../../utils/hotkey-service';
import { appEventService } from '../app-event-service';
import { BuildInfo } from '../interfaces';
import { mainService } from '../main-service';
import { DefaultSystemNameTab } from '../settings/settings-tabs';
import { userService } from '../user';
import { StatefulWindow } from './stateful-window';
import { DialogActionType, DialogConstructorOptions, DialogData, DialogType, DialogWindowData, DialogWindowSize, IDialogControl, InputSnapshot } from './window-api';
import { makeBrowserViewOptions } from './window-options';
import { windowService } from '.';

export const SCROLLBAR_PRELOAD = 'preload/scrollbar-preload.js';

export const NO_BUTTON_ACTION = -1;
export interface DialogBounds {
	x: number;
	y: number;
}

interface CreateDialogOptions {
	data: DialogData;
	size: DialogWindowSize;
	parentWindow?: BrowserWindow;
	isModal?: boolean;
	closeOnBlur?: boolean;
	closeOnSubmit?: boolean;
	dataChange?: Observable<DialogData>;
	isShow?: boolean;
	isTransparent?: boolean;
	currentActiveTab?: DefaultSystemNameTab;
	buildInfo?: BuildInfo;
}

export const DIALOG_WINDOW_REMOTE_CONTRACT = 'tvd:dialog-window';

@logCallName('DialogWindow')
export class DialogWindow extends StatefulWindow implements IDialogControl {
	private static readonly macRoundingMargin = 28;

	private navigationHandler: DialogNavigationHandler;
	private remoteServiceInstanceId: string;
	private data: DialogData;
	private inputAwaiter: Promise<InputSnapshot | undefined>;
	private input: InputSnapshot = {
		dialogAction: DialogActionType.Unknown,
		button: NO_BUTTON_ACTION,
	};

	private inputProcessor = new InputProcessor(this);

	private closeOnSubmit = true;

	private readyToShow: Promise<void>;

	private displayData: Display[] = [];
	private scaleChangeSubscription: Subscription | undefined;

	private currentActiveTab?: DefaultSystemNameTab;
	private buildInfo?: BuildInfo;

	dataChange: Observable<DialogData> | undefined;

	@logCall
	public static async showDialogWindow(dialogCreateOptions: CreateDialogOptions): Promise<InputSnapshot> {
		const dialog = await this.createDialogWindow(dialogCreateOptions);

		dialog.windowRef.webContents.on('dom-ready', () => {
			dialog.show();
			dialog.windowRef.moveTop();
		});

		return dialog.waitInput();
	}

	@logCall
	public static async createDialogWindow(dialogCreateOptions: CreateDialogOptions): Promise<DialogWindow> {
		const {
			data,
			size,
			parentWindow,
			isModal,
			closeOnBlur,
			closeOnSubmit,
			dataChange,
			isShow,
			isTransparent = true,
			currentActiveTab,
			buildInfo,
		} = dialogCreateOptions;

		const dialogWindowHeight = isDarwin() ? size.height + this.macRoundingMargin : size.height;
		const dialogOptions: DialogConstructorOptions = {
			data,
			windowOptions: {
				height: dialogWindowHeight,
				width: size.width,
				hasShadow: true,
				show: !!isShow,
				frame: false,
				resizable: false,
				parent: parentWindow,
				closable: closeOnSubmit,
				fullscreenable: false,
				transparent: isTransparent,
				modal: isModal,
				movable: false,
				webPreferences: {
					devTools: mainService().isDebugMode(),
					nodeIntegration: true,
					contextIsolation: false,
					preload: FileSystemProvider.makeAppRootPath(SCROLLBAR_PRELOAD),
				},
			},
			buildInfo,
			currentActiveTab,
			dataChange,
			closeOnBlur,
			closeOnSubmit,
		};

		const dialogPath = join(app.getAppPath(), 'app/dialog-window', 'index.html');
		const dialog = new DialogWindow(dialogOptions, dialogPath);

		if (isWin32() && parentWindow && data.type === DialogType.Settings) {
			this.subscriptionToChangeParentWindow(dialog.windowRef, dialogWindowHeight, size.width);
		}

		dialog.windowRef.webContents
			.on('before-input-event', (ev: Event, input: Input) => {
				dialog.acceptInput(ev, input);
			});

		// no closable implementation on Linux
		if (isLinux()) {
			dialog.windowRef.isClosable = () => { return closeOnSubmit ?? true; };
		}

		await dialog.load();
		dialog.centerInParent(dialogWindowHeight, size.width, data.type !== DialogType.SaveChanges);

		dialog.scaleChangeSubscription = mainService().displayScaleChange.subscribe(display => {
			try {
				if (isLinux()) {
					dialog.updateDialogBounds(display);
					dialog.updateDisplayData(display);
				}
				dialog.windowRef.center();
			}
			catch (err) {
				loggerService().error(`scaleChangeSubscription(): ${ getMessageOfError(err) }`);
			}
		});

		if (data.type === DialogType.Welcome) {
			const user = userService().getCurrentUser();

			if (user.isAnonymous) {
				return dialog;
			}
		}

		return dialog;
	}

	private static subscriptionToChangeParentWindow(dialog: BrowserWindow, height: number, width: number): void {
		const setCenterDialog = (): void => {
			if (dialog.isDestroyed() || !dialog.isVisible()) {
				return;
			}

			const parentWindow = dialog.getParentWindow();
			if (!parentWindow) {
				return;
			}

			const [parentX, parentY] = parentWindow.getPosition();
			const [widthParent, heightParent] = parentWindow.getSize();
			const x = Math.round(widthParent / 2 - width / 2);
			const y = Math.round(heightParent / 2 - height / 2);
			dialog.setPosition(parentX + x, parentY + y, false);
			dialog.setBounds({ width, height });
		};

		dialog.on('show', () => {
			const focusWindow = BrowserWindow.getFocusedWindow()?.getParentWindow();
			const parentWindow = dialog.getParentWindow();
			if (focusWindow && focusWindow !== parentWindow) {
				dialog.setParentWindow(focusWindow);
				parentWindow?.removeListener('move', setCenterDialog);
				parentWindow?.removeListener('resize', setCenterDialog);
			}

			focusWindow?.on('move', setCenterDialog);
			focusWindow?.on('resize', setCenterDialog);
		});

		dialog.on('close', () => {
			dialog.getParentWindow()?.removeListener('move', setCenterDialog);
			dialog.getParentWindow()?.removeListener('resize', setCenterDialog);
		});
	}

	constructor(dialogOptions: DialogConstructorOptions, url: string) {
		super(dialogOptions.windowOptions, url);

		this.data = dialogOptions.data;
		this.dataChange = dialogOptions.dataChange;
		this.currentActiveTab = dialogOptions.currentActiveTab;
		this.buildInfo = dialogOptions.buildInfo;

		this.displayData = screen.getAllDisplays();

		this.remoteServiceInstanceId = IpcServices.registerRemoteObject(this, DIALOG_WINDOW_REMOTE_CONTRACT);
		loggerService().debug(`Dialog registered ${ shortifyId(this.remoteServiceInstanceId) }`);

		this.inputAwaiter = new Promise((resolve) => {
			this.inputResolver = resolve;
		});

		this.readyToShow = new Promise((resolve) => {
			this.showResolver = resolve;
		});

		this.windowRef.on('blur', () => {
			if (this.windowRef && dialogOptions.closeOnBlur) {
				this.closeDialogWindow(DialogActionType.OutsideClick);
			}
			appEventService().setIsAutosaveInProgress(false);
		});

		this.navigationHandler = new DialogNavigationHandler(this);

		if (typeof dialogOptions.closeOnSubmit !== 'undefined') {
			this.closeOnSubmit = dialogOptions.closeOnSubmit;
		}

		const shutdownSub = appEventService().shutdown.subscribe(() => {
			shutdownSub.unsubscribe();
			this.closeDialogWindow();
		});
	}

	private updateDisplayData(display: Display): void {
		this.displayData = this.displayData.map(displayItem => {
			if (displayItem.id === display.id) {
				return display;
			}

			return displayItem;
		});
	}

	private updateDialogBounds(display: Display): void {
		const currentDialogDisplay = screen.getDisplayMatching(this.windowRef.getBounds());
		if (currentDialogDisplay.id !== display.id) {
			return;
		}
		// eslint-disable-next-line no-return-assign
		const oldScale = this.displayData.find(d => d.id = display.id)?.scaleFactor;
		if (!oldScale) {
			return;
		}
		const newScale = display.scaleFactor;
		const dialogBounds = this.windowRef.getBounds();
		const scaleModifier = newScale / oldScale;
		const windowNewWidth = Math.ceil(dialogBounds.width * scaleModifier);
		const windowNewHeight = Math.ceil(dialogBounds.height * scaleModifier);

		this.windowRef.setSize(windowNewWidth, windowNewHeight);
		this.windowRef.center();
	}

	protected override onWindowClose(): void {
		this.inputResolver(this.input);

		if (this.scaleChangeSubscription) {
			this.scaleChangeSubscription.unsubscribe();
		}

		appEventService().setIsAutosaveInProgress(false);
	}

	@logCall
	public closeSaveChangeDialog(): void {
		if (this.windowRef.isDestroyed()) {
			return;
		}

		const wnd = this.windowRef.getParentWindow();
		if (!wnd || wnd.isDestroyed()) {
			return;
		}

		const ref = windowService().findWindow({ refWindow: wnd });
		if (!ref || ref.windowRef.isDestroyed()) {
			return;
		}

		this.close();

		ref.saveChangesDialog = null;
	}

	private inputResolver: (value?: InputSnapshot | PromiseLike<InputSnapshot> | undefined) => void = () => { };
	private showResolver: () => void = () => { };

	submitInput(input: InputSnapshot): void {
		loggerService().info(`[DialogWindow]: dialog ${ this.data.title ?? 'without title' } submitted with ${ this.data.buttons ? this.data.buttons[input.button].text : 'default' }`);

		this.input = input;

		if (this.data.type === DialogType.Welcome) {
			return;
		}

		if (this.closeOnSubmit) {
			this.closeDialogWindow();
		}
		else {
			this.hide();
		}
	}

	@logCall
	closeDialogWindow(dialogAction?: DialogActionType): void {
		if (dialogAction !== undefined) {
			this.input.dialogAction = dialogAction;
		}

		this.inputResolver(this.input);

		let parentWnd: Electron.BrowserWindow | null = null;
		if (!this.windowRef.isDestroyed()) {
			parentWnd = this.windowRef.getParentWindow();
			this.windowRef.close();
		}

		if (isWin32() && parentWnd && !parentWnd.isDestroyed()) {
			parentWnd.moveTop();
			parentWnd.focus();
		}

		if (this.remoteServiceInstanceId !== '') {
			IpcServices.unregisterRemoteObject(this.remoteServiceInstanceId);
		}
	}

	changeParent(wnd: BrowserWindow | null): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling changeParent on dialog that was destroyed');
			return;
		}

		if (wnd && this.windowRef.id === wnd.id) {
			return;
		}

		this.windowRef.setParentWindow(wnd);

		const currentBounds = this.windowRef.getBounds();

		this.centerInParent(currentBounds.height, currentBounds.width);
	}

	@logCall
	async waitInput(): Promise<InputSnapshot> {
		await this.inputAwaiter;

		return this.input;
	}

	async addCustomView(url: string, bounds: Rectangle, customPreload: string | null = null): Promise<BrowserView> {
		const viewOptions = makeBrowserViewOptions(false, customPreload);

		const view = new BrowserView(viewOptions);
		this.windowRef.setBrowserView(view);
		view.setBounds(bounds);

		await view.webContents.loadURL(url);

		view.webContents.on('before-input-event', (ev: Event, input: Electron.Input) => {
			if (input.key === 'Escape' || input.key === 'Esc') {
				this.close();
			}
		});

		return view;
	}

	removeCustomView(): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling removeCustomView on dialog that was destroyed');
			return;
		}
		const view = this.windowRef.getBrowserView();

		if (view) {
			this.windowRef.removeBrowserView(view);
		}
	}

	override show(): void {
		super.show(true);
	}

	protected override get rendererInitialData(): DialogWindowData {
		return {
			remoteServiceInstanceId: this.remoteServiceInstanceId,
			dialogData: this.data,
			currentActiveTab: this.currentActiveTab,
			buildInfo: this.buildInfo,
		};
	}

	protected override async onFinishLoad(): Promise<void> {
		if (!this.windowRef.isDestroyed() && !this.windowRef.isVisible()) {
			await this.readyToShow;
			this.show();
			super.moveTop();
			loggerService().info(`[DialogWindow]: dialog ${ this.data.title ?? 'without title' } showed`);
		}
	}

	centerInParent(height: number, width: number, hasFitInScreen = true): void {
		if (this.windowRef.isDestroyed()) {
			loggerService().error('Calling centerInParent on dialog that was destroyed');
			return;
		}
		const parentWindow = this.windowRef.getParentWindow();

		if (!parentWindow) {
			return;
		}

		const setDialogBounds = (x?: number, y?: number): void => {
			this.windowRef.setBounds({ height, width, x, y });
			// does not position dialog correctly at the first time due to dpi awareness
			this.windowRef.setBounds({ height, width, x, y });
		};

		if (parentWindow) {
			const parentBounds = parentWindow.getBounds();
			const centeredBounds = centeredRect(parentBounds, width, height);

			const { bounds: screenBounds, size: screenSize } = screen.getDisplayNearestPoint(centeredBounds);

			const fitInScreen = (value: number, body: number, minValue: number, maxValue: number): number => {
				if (value < minValue) {
					return minValue;
				}
				if (value + body > maxValue) {
					return maxValue - body;
				}
				return value;
			};

			const dialogX = hasFitInScreen ? fitInScreen(centeredBounds.x, centeredBounds.width, screenBounds.x, screenBounds.x + screenSize.width) : parentBounds.x;
			const dialogY = hasFitInScreen ? fitInScreen(centeredBounds.y, centeredBounds.height, screenBounds.y, screenBounds.y + screenSize.height) : parentBounds.y;

			if (this.data.type === DialogType.Welcome && !isDarwin()) {
				parentWindow.setBounds({ x: dialogX, y: dialogY });
			}

			setDialogBounds(dialogX, dialogY);

			this.showResolver();
		}
	}

	acceptInput(ev: Event, input: Input): void {
		this.inputProcessor.injectInput(ev, input);
	}

	override dispose(): void {
		appEventService().setIsAutosaveInProgress(false);
		super.dispose();
	}

	@bindHotkeyCommand('show-wnd-dev-tools', { pred: () => { return mainService().isDebugMode(); } })
	private showDevToolsCommand(): void {
		this.showDevTools();
	}
}
