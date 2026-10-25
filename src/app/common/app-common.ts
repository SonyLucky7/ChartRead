import { ipcRenderer } from 'electron';

import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { IToastWindowHandler } from '../../services/window/toast';
import {
	IDialogControl,
	IFullscreenHandler,
	ITabbedWindowControl,
	ITooltipsControl,
	IWindowMenuControl,
	RendererServiceData,
	WindowData,
} from '../../services/window/window-api';
import { VIEW_READY_MESSAGE } from '../../tv-api/tvd-channels';
import { jsonParse } from '../../utils/json-parse';
import { isDarwin } from '../../utils/platform';
import { isInBounds, Position, Rectangle } from '../../utils/Position';

declare global {
	interface Window {
		remoteServiceInstanceId: string | undefined;
		initialRemoteServiceInstanceId: string | null;
	}
}

export type TabbedWindowControl =
	ITabbedWindowControl
	& IFullscreenHandler
	& ITooltipsControl
	& IWindowMenuControl;

interface ServicesCollection {
	windowControl: Promisify<TabbedWindowControl> | null;
	dialogControl: Promisify<IDialogControl> | null;
	toastWindowHandler: Promisify<IToastWindowHandler> | null;
}

type ServicesSignatures = Exclude<ServicesCollection[keyof ServicesCollection], null>;

const services__: ServicesCollection = {
	windowControl: null,
	dialogControl: null,
	toastWindowHandler: null,
};

export function getRendererInitialData<T = WindowData>(): T {
	const result = jsonParse<T>(new URLSearchParams(window.location.search).get('rendererInitialData') ?? '{}');
	if (!result) {
		throw new Error('getRendererInitialData() jsonParse error');
	}
	return result;
}

function initializeIpcProxyForInstance<T extends Promisify<ServicesSignatures>>(
	nameService: keyof ServicesCollection,
	instance: Promisify<T> | null,
	forceReplaceInstanceId?: string,
): Promisify<T> {
	let instanceId: string = window?.remoteServiceInstanceId ?? getRendererInitialData<RendererServiceData>().remoteServiceInstanceId;

	if (forceReplaceInstanceId) {
		instanceId = forceReplaceInstanceId;
	}

	if (!instance || instanceId !== window?.initialRemoteServiceInstanceId) {
		loggerServiceProxy().debug(`[Renderer] initializeIpcProxyForInstance ${ nameService } id: ${ instanceId }; Old id ${ window?.initialRemoteServiceInstanceId }`);

		const instanceService = IpcServices.provideProxy<T>(instanceId);
		window.initialRemoteServiceInstanceId = instanceId;

		return instanceService;
	}

	return instance;
}

export function getWindowControl(remoteServiceInstanceIdFromToast?: string): Promisify<TabbedWindowControl> {
	services__.windowControl = initializeIpcProxyForInstance<TabbedWindowControl>('windowControl', services__.windowControl, remoteServiceInstanceIdFromToast);
	return services__.windowControl;
}

export function getDialogControl(): Promisify<IDialogControl> {
	services__.dialogControl = initializeIpcProxyForInstance<IDialogControl>('dialogControl', services__.dialogControl);
	return services__.dialogControl;
}

export function getToastWindowHandlers(): Promisify<IToastWindowHandler> {
	services__.toastWindowHandler = initializeIpcProxyForInstance<IToastWindowHandler>('toastWindowHandler', services__.toastWindowHandler);
	return services__.toastWindowHandler;
}

export async function validateHoveredState(x: number, y: number, elementId: string, mounted: boolean): Promise<boolean> {
	if (!mounted) {
		return false;
	}

	const element = document.getElementById(elementId);

	if (!element) {
		return false;
	}

	const elementRect = element.getBoundingClientRect();

	let windowRect: Rectangle;

	try {
		windowRect = await getWindowControl().getWindowBounds();
	}
	catch (err) {
		console.warn(err);

		return false;
	}
	// x and y are screen coordinates, so need to calculate cursor position within the window
	const windowCursorPoint: Position = {
		x: x - windowRect.x,
		y: y - windowRect.y,
	};

	const hoverState = isInBounds(elementRect, windowCursorPoint);

	return hoverState;
}

export function notifyViewReady(): void {
	ipcRenderer.send(VIEW_READY_MESSAGE);
}

export function semiboldStyleOnDarwin(): React.CSSProperties {
	return {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		fontWeight: isDarwin() ? 600 : 700,
	};
}
