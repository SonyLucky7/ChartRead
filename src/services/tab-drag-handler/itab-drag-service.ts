import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { Position } from '../../utils';
import { ControlsAreaWidth } from '../window/window-api';

export const TAB_DRAG_HANDLER_CONTRACT = 'tvd:tab-drag-handler';

export interface ITabDragHandler {
	startWindowDrag(windowId: string, tabId: string, position: Position): Promise<void>;
	dragTabOut(windowId: string, tabId: string, position: Position, tabWidth?: number, controlsWidth?: ControlsAreaWidth): Promise<void>;
	dragTabIn(windowId: string, tabIndex: number, tabOffset?: number): Promise<void>;
}

export interface IDragHandler {
	handleDragStart(): void;
	handleDragEnd(): void;
}

export function tabDragHandler(): ITabDragHandler {
	return IpcServices.provide<ITabDragHandler>(TAB_DRAG_HANDLER_CONTRACT);
}

export function tabDragHandlerProxy(): Promisify<ITabDragHandler> {
	return IpcServices.provideProxy<ITabDragHandler>(TAB_DRAG_HANDLER_CONTRACT);
}
