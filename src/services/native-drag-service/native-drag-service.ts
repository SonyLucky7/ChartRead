import { Subscription } from 'rxjs';
import { screen } from '@electron/remote';

import { notifyViewReady } from '../../app/common/app-common';
import { CONTROL_TO_TABS_GAP } from '../../app/window/tab-panel/tab-panel';
import { Promisify } from '../../ipc-remote';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId } from '../../logger/log-formatter';
import { ButtonEvent, PointerCapture } from '../../native';
import { MouseButton } from '../../native/hardware';
import { getMouseButtonState } from '../../native/hwtools';
import { capturePointer } from '../../native/renderer';
import { Disposable } from '../../tvd-runtime/core';
import { ignorePromise, sleep } from '../../utils/async';
import { isRtlRender } from '../../utils/locale';
import { isDarwin } from '../../utils/platform';
import { getWindowRelativePoint, isInBounds, Position, Rectangle } from '../../utils/Position';
import { DARWIN_CONTROLS_WIDTH } from '../interfaces';
import { mainServiceProxy } from '../main-service';
import { StatefulService } from '../stateful-service';
import { IDragHandler, tabDragHandlerProxy } from '../tab-drag-handler/renderer';
import { windowServiceProxy } from '../window';
import { ScreenPointConverter } from '../window/screen-point-converter';
import { IWindowControl, WindowBounds } from '../window/window-api';
import { DRAG_SERVICE_CONTRACT, IDragService, IElement } from './inative-drag-service';

enum DragStage {
	NoDrag = 0,
	DragStarted = 10,
	InDrag = 20,
	DragEnded = 30,
}

interface DragAction {
	value: DragStage;
	atomic: boolean;
	run(state: DragServiceState): Promise<void>;
}

interface ActionContext {
	stateSnapshot: DragServiceState;
	dragAction: DragAction;
}

interface DnDElement {
	id: string;
	remoteInstance: Promisify<IElement>;
	window: Promisify<IWindowControl>;
	cachedWindowBounds?: Rectangle;
	draggable?: boolean;
	droppable?: boolean;
}

interface DragServiceState {
	isInDrag: boolean;
	lastDragAction: DragStage;
	leftPressed: boolean;
	dragStartElementId?: string;
	isRequestedDragStart?: boolean;
	position?: Position;
	stage?: DragStage;
}

@ExposeSingletonService(DRAG_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('NativeDragService')
export class NativeDragService extends StatefulService<DragServiceState>
	implements IDragService, Disposable {
	remoteInstanceId?: string;

	private readonly deltaValue = 30;
	private pointConverter: ScreenPointConverter;
	private capturer: PointerCapture;
	private appElements: DnDElement[] = [];
	private handlers: IDragHandler[] = [];

	private lockAppElements: Promise<DnDElement[]> | undefined;

	private buttonSubscription?: Subscription;
	private cursorSubscription?: Subscription;

	private dropTarget?: DnDElement;
	private draggedElement?: DnDElement;
	private dragData?: unknown;

	private isDestroyed = false;
	private actionQueue: ActionContext[] = [];

	constructor() {
		super();
		loggerServiceProxy().info('Creating drag service');

		notifyViewReady();

		this.resetState();

		this.pointConverter = new ScreenPointConverter(screen, mainServiceProxy());
		this.capturer = capturePointer();
		this.handlers.push(tabDragHandlerProxy() as unknown as Promisify<IDragHandler>);
		ignorePromise(this.watchActions());

		this.stateChanged.subscribe({
			next: (state) => {
				this.onStateUpdated(state);
			},
		});
	}

	private onStateUpdated(state: DragServiceState): void {
		let stage = state.stage ?? DragStage.NoDrag;
		let runAction: (state: DragServiceState) => Promise<void> =
			() => Promise.resolve();

		if (state.isRequestedDragStart && !state.isInDrag) {
			stage = DragStage.DragStarted;
			runAction = this.handleDragStart;
		}

		if (state.isInDrag) {
			if (state.leftPressed) {
				stage = DragStage.InDrag;
				runAction = this.handleDrag;
			}
			else {
				stage = DragStage.DragEnded;
				runAction = this.handleDragEnd;
			}
		}

		const dragAction: DragAction = {
			value: stage,
			atomic: stage !== DragStage.InDrag,
			run: runAction.bind(this),
		};

		this.actionQueue.push({
			dragAction,
			stateSnapshot: state,
		});
	}

	private async watchActions(): Promise<void> {
		const maxOperations = 10;
		const waitTimeout = 1;

		while (!this.isDestroyed) {
			try {
				if (this.actionQueue.length === 0) {
					await sleep(waitTimeout);
					continue;
				}

				if (this.actionQueue.length >= maxOperations) {
					this.actionQueue = this.reduceActions(this.actionQueue);
				}

				let action: ActionContext | undefined;
				let haveUniqueAction = false;
				let attempts = 0;

				while (!haveUniqueAction && attempts <= this.actionQueue.length - 1) {
					action = this.actionQueue.shift();

					const isPreviousStageOperation = action && (action.dragAction.value < this.state.lastDragAction && action.dragAction.value !== DragStage.NoDrag);
					const isSameOperation = action && (action.dragAction.value === this.state.lastDragAction && action.dragAction.atomic);

					if (!action || isPreviousStageOperation || isSameOperation) {
						attempts++;
						continue;
					}

					haveUniqueAction = true;
				}

				if (!haveUniqueAction || !action) {
					await sleep(waitTimeout);
					continue;
				}

				console.log(`Last action: ${ this.mapActionToString(this.state.lastDragAction) }, will do action: ${ this.mapActionToString(action.dragAction.value) }`);
				this.setState({ lastDragAction: action.dragAction.value }, false);
				await action.dragAction.run(action.stateSnapshot);
				console.log(`Handled action: ${ this.mapActionToString(action.dragAction.value) }`);
			}
			catch (err) {
				loggerServiceProxy().error('[NativeDragService:watchActions] error in main cycle', err);
			}
		}
	}

	private mapActionToString(stage: DragStage): string {
		switch (stage) {
			case DragStage.NoDrag:
				return 'NoDrag';
			case DragStage.InDrag:
				return 'InDrag';
			case DragStage.DragStarted:
				return 'DragStart';
			case DragStage.DragEnded:
				return 'DragEnd';
			default:
				return '';
		}
	}

	private reduceActions(actions: ActionContext[]): ActionContext[] {
		const canMergeContext = (c1: ActionContext, c2: ActionContext): boolean => {
			return c1.dragAction.value === c2.dragAction.value;
		};

		const maxMergeCount = 5;
		let mergeCount = 0;

		const mergedActions: ActionContext[] = [];

		mergedActions.push(actions[0]);

		for (let i = 0; i < actions.length - 2; i++) {
			const ctx1 = actions[i];
			const ctx2 = actions[i + 1];

			if (!canMergeContext(ctx1, ctx2) || mergeCount >= maxMergeCount) {
				mergedActions.push(ctx2);
				mergeCount = 0;
				continue;
			}

			mergedActions[mergedActions.length - 1] = ctx2;
			mergeCount++;
		}

		return mergedActions;
	}

	// triggered by renderer process on receiving dragStart event
	async startDrag(id: string): Promise<void> {
		if (this.state.isInDrag) {
			loggerServiceProxy().warn('[NativeDragService:startDrag] Incorrect drag state, will call reset');
			this.resetState();
		}

		loggerServiceProxy().info(`Starting drag tab [${ shortifyId(id) }]`);

		this.subscribeToPointerCapture();

		const appElements = this.lockAppElements ? await this.lockAppElements : this.appElements;
		const actualAppElements = await windowServiceProxy().getDragElements();
		const elementsToUnregister = appElements.filter(el => !actualAppElements.includes(el.id));
		if (elementsToUnregister.length > 0) {
			for (const el of elementsToUnregister) {
				await this.unregister(el.id);
			}
		}

		await this.lockAppElements;
		for (const el of appElements) {
			try {
				el.cachedWindowBounds = await el.window.getWindowBounds();
			}
			catch (err) {
				console.warn('[NativeDragService:startDrag] Error getting window bounds');
				console.log(err);
				void this.unregister(el.id);
			}
		}

		this.dragData = { tabId: id };

		this.setState({
			position: this.state.position,
			isRequestedDragStart: true,
			dragStartElementId: id,
		});
	}

	resetState(): void {
		this.state = {
			isInDrag: false,
			leftPressed: this.state.leftPressed,
			isRequestedDragStart: undefined,
			position: undefined,
			lastDragAction: DragStage.NoDrag,
		};

		this.draggedElement = undefined;

		this.appElements.forEach(el => {
			el.cachedWindowBounds = undefined;
		});

		this.dropTarget = undefined;

		this.unsubscripeFromPointerCapture();
	}

	getIsInDrag(): boolean {
		return this.state.isInDrag && this.state.leftPressed;
	}

	getDragData<T>(): T {
		return this.dragData as T;
	}

	@logCall
	setDragData(data: unknown): void {
		this.dragData = data;
	}

	getCursorPosition(): Position | undefined {
		return this.state.position;
	}

	@logCall
	registerHandler(handler: IDragHandler): void {
		this.handlers.push(handler);
	}

	@logCall
	async registerDraggable(id: string, windowId: string): Promise<void> {
		await this.registerElement(id, windowId, { draggable: true });
	}

	@logCall
	async registerDroppable(id: string, windowId: string): Promise<void> {
		await this.registerElement(id, windowId, { droppable: true });
	}

	async unregister(id: string): Promise<void> {
		loggerServiceProxy().debug(`NativeDragService.unregister(): "Will unregister: ${ shortifyId(id) }"`);
		if (this.lockAppElements) {
			await this.lockAppElements;
		}

		this.lockAppElements = new Promise((resolve) => {
			this.clearElements(id);
			resolve(this.appElements);
		});
	}

	async getHoveredWindowBounds(): Promise<WindowBounds | undefined> {
		if (!this.state.position) {
			return;
		}

		const windows = await windowServiceProxy().getActiveWindowsBounds();

		for (const wnd of windows) {
			if (isInBounds(wnd.bounds, this.state.position)) {
				return wnd;
			}
		}

		return windows[0];
	}

	@logCall
	private async handleDragStart(state: DragServiceState): Promise<void> {
		if (!state.position || !state.dragStartElementId) {
			loggerServiceProxy().warn(`Abort drag start: position = ${ JSON.stringify(state.position) }, dragStartElementId = ${ JSON.stringify(state.dragStartElementId) }`);
			return;
		}

		const draggedElement = this.appElements.find(el => el.id === state.dragStartElementId && el.draggable);

		if (!draggedElement?.cachedWindowBounds) {
			console.error('no dragged element or no cached bounds');
			return;
		}

		let relativePoint = getWindowRelativePoint(state.position, draggedElement.cachedWindowBounds);

		// normalize start point
		const elBounds = await draggedElement.remoteInstance.getBounds();
		relativePoint = {
			x: Math.min(Math.abs(relativePoint.x), elBounds.x + elBounds.width),
			y: Math.min(Math.abs(relativePoint.y), elBounds.y + elBounds.height),
		};

		await draggedElement.remoteInstance.onDragStart(relativePoint);

		this.draggedElement = draggedElement;

		const droppableElement = await this.findElement((el) => !!el.droppable, await draggedElement.window.getWindowId(), relativePoint, this.deltaValue);

		if (droppableElement) {
			await droppableElement.remoteInstance.onDragEnter(relativePoint);
			this.dropTarget = droppableElement;
		}

		this.setState({ isInDrag: true, isRequestedDragStart: false, dragStartElementId: undefined }, false);
		this.handlers.forEach(h => h.handleDragStart());
	}

	@logCall
	private async handleDragEnd(state: DragServiceState): Promise<void> {
		if (!state.position) {
			loggerServiceProxy().warn('Abort drag end');
			return;
		}

		let target = '';

		const windowBounds = await this.getHoveredWindowBounds();

		if (windowBounds) {
			const relativePoint = getWindowRelativePoint(state.position, windowBounds.bounds);
			const droppableElement = await this.findElement((el) => !!el.droppable, windowBounds.id, relativePoint, this.deltaValue);

			if (droppableElement) {
				await droppableElement.remoteInstance.onDrop(relativePoint);
				target = droppableElement.id;
			}
		}

		if (this.draggedElement?.cachedWindowBounds) {
			const dragRelativePoint = getWindowRelativePoint(state.position, this.draggedElement.cachedWindowBounds);
			await this.draggedElement.remoteInstance.onDragEnd(dragRelativePoint, target);
		}

		this.draggedElement = undefined;

		this.appElements.forEach(el => {
			el.cachedWindowBounds = undefined;
		});

		this.setState({
			isInDrag: false,
		});

		this.unsubscripeFromPointerCapture();
		this.dropTarget = undefined;
		this.handlers.forEach(h => h.handleDragEnd());
	}

	private async handleDrag(state: DragServiceState): Promise<void> {
		const hoveredWindowBounds = await this.getHoveredWindowBounds();

		if (!state.position || !hoveredWindowBounds) {
			return;
		}

		const relativePoint = getWindowRelativePoint(state.position, hoveredWindowBounds.bounds);

		let dropTargetRelativePoint: Position | undefined;

		if (this.dropTarget) {
			const windowBounds = this.dropTarget.cachedWindowBounds ?? await this.dropTarget.window.getWindowBounds();
			dropTargetRelativePoint = getWindowRelativePoint(state.position, windowBounds);
		}

		const droppableElement = await this.findElement((el) => !!el.droppable, hoveredWindowBounds.id, relativePoint, this.deltaValue);

		if (!droppableElement) {
			if (this.dropTarget && dropTargetRelativePoint) {
				await this.dropTarget.remoteInstance.onDragLeave(dropTargetRelativePoint);
				this.dropTarget = undefined;
			}
			return;
		}

		if (!this.dropTarget) {
			await droppableElement.remoteInstance.onDragEnter(relativePoint);
			this.dropTarget = droppableElement;
			return;
		}

		if (this.dropTarget.id === droppableElement.id) {
			await droppableElement.remoteInstance.onDragOver(relativePoint);
			return;
		}

		if (dropTargetRelativePoint) {
			await this.dropTarget.remoteInstance.onDragLeave(dropTargetRelativePoint);
		}
		await droppableElement.remoteInstance.onDragEnter(relativePoint);

		this.dropTarget = droppableElement;
	}

	private async findElement(
		condition: (el: DnDElement) => boolean,
		windowId: string,
		point: Position,
		delta: number
	): Promise<DnDElement | undefined> {
		const appElements = this.lockAppElements ? await this.lockAppElements : this.appElements;

		for (const el of appElements) {
			const actualAppElements = this.lockAppElements ? await this.lockAppElements : this.appElements;
			if (!actualAppElements.includes(el)) {
				continue;
			}

			const elementWindowDisposed = await el.window.disposed();

			if (elementWindowDisposed) {
				continue;
			}

			const elementMouseEventsAllowed = await el.window.getAllowMouseEvents();
			const elementWindowId = await el.window.getWindowId();

			// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
			// eslint-disable-next-line no-mixed-operators
			if (!condition(el) || !elementMouseEventsAllowed || elementWindowId !== windowId) {
				continue;
			}

			try {
				const elBounds = await el.remoteInstance.getBounds();

				const hasControlsOnTheLeft = isDarwin() && !isRtlRender();

				const isPointerOverControls = point.x < CONTROL_TO_TABS_GAP + DARWIN_CONTROLS_WIDTH;
				// Ltr macOS has controls on the left, so it causes false DnD triggering
				// to prevent the behavior, we move the tab element border (delta + padding) pixels right
				if (hasControlsOnTheLeft && isPointerOverControls) {
					elBounds.x = elBounds.x + delta + CONTROL_TO_TABS_GAP;
				}
				if (isInBounds(elBounds, point, delta)) {
					return el;
				}
			}
			catch (err) {
				loggerServiceProxy().error(`[NativeDragService.findElement()] Error getting element bounds for ${ el.id }`, err);
				void this.unregister(el.id);
			}
		}
	}

	private async registerElement(id: string, windowId: string, options?: { draggable?: boolean; droppable?: boolean; }): Promise<void> {
		let element: Promisify<IElement>;

		try {
			element = IpcServices.provideProxy<IElement>(id);
		}
		catch (err) {
			loggerServiceProxy().error(`[NativeDragService.registerElement()] Failed to register ${ id }`, err);

			return;
		}

		const window = IpcServices.provideProxy<IWindowControl>(windowId);

		if (!window) {
			console.warn(`Could not find window with id: ${ windowId }`);
			return;
		}

		const dndElement: DnDElement = {
			id,
			remoteInstance: element,
			window,
			droppable: options?.droppable,
			draggable: options?.draggable,
		};

		if (this.lockAppElements) {
			await this.lockAppElements;
		}

		this.lockAppElements = new Promise((resolve) => {
			this.appElements.push(dndElement);

			resolve(this.appElements);
		});
	}

	private clearElements(id: string): DnDElement[] {
		const filteredElements: DnDElement[] = [];

		for (const el of this.appElements) {
			if (el.id !== id) {
				filteredElements.push(el);
			}
		}

		if (this.draggedElement?.id === id) {
			this.draggedElement = undefined;
		}

		if (this.dropTarget?.id === id) {
			this.dropTarget = undefined;
		}

		this.appElements = filteredElements;
		return this.appElements;
	}

	private subscribeToPointerCapture(): void {
		this.state.leftPressed = getMouseButtonState(MouseButton.Left);
		this.state.position = screen.getCursorScreenPoint();

		loggerServiceProxy().debug(`Initial drag state prepared: leftPressed = ${ this.state.leftPressed }, position = ${ JSON.stringify(this.state.position) }`);

		if (!this.buttonSubscription) {
			this.buttonSubscription = this.capturer.onButtons().subscribe((buttonsData) => {
				if (buttonsData.left === ButtonEvent.Down) {
					this.setState({
						leftPressed: true,
					});
				}
				else if (buttonsData.left === ButtonEvent.Up) {
					this.setState({
						leftPressed: false,
						lastDragAction: DragStage.NoDrag,
					});
				}
				else {
					loggerServiceProxy().warn('Received ButtonEvent.None event');
				}
			});
		}

		if (!this.cursorSubscription) {
			this.cursorSubscription = this.capturer.onMotion().subscribe((motionData) => {
				this.setState({
					position: this.pointConverter.fromMotionEventToScreenPoint(motionData),
				});
			});
		}
	}

	private unsubscripeFromPointerCapture(): void {
		this.cursorSubscription?.unsubscribe();
		this.buttonSubscription?.unsubscribe();

		this.cursorSubscription = undefined;
		this.buttonSubscription = undefined;
	}

	dispose(): void {
		this.isDestroyed = true;
		this.pointConverter.dispose();
		this.unsubscripeFromPointerCapture();
	}
}
