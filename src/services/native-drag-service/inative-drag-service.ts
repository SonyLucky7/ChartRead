import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { Position, Rectangle } from '../../utils';
import { IDragHandler } from '../tab-drag-handler/renderer';

export const DRAG_SERVICE_CONTRACT = 'tvd:drag-service';

export interface IDragService {
	startDrag(id: string): void;
	registerHandler(handler: IDragHandler): void;
	registerDraggable(id: string, windowId: string): Promise<void>;
	registerDroppable(id: string, windowId: string): Promise<void>;
	unregister(id: string): Promise<void>;

	setDragData(data: unknown): void;
	getDragData<T>(): T;

	getCursorPosition(): Position | undefined;

	getIsInDrag(): boolean;
	resetState(): void;

	dispose(): void;
}

export function dragServiceProxy(): Promisify<IDragService> {
	return IpcServices.provideProxy<IDragService>(DRAG_SERVICE_CONTRACT);
}

export const defaultBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 };

export interface IDragEventHandler {
	onDragStart(point: Position): void;
	onDragEnd(point: Position, target?: string): void;

	onDragOver(point: Position): void;
	onDragEnter(point: Position): void;
	onDragLeave(point: Position): void;
	onDrop(point: Position): void;
}

export interface IElement extends IDragEventHandler {
	getBounds(): Promise<Rectangle>;
}
