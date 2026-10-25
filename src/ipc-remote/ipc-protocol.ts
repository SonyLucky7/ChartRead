import { ipcMain, type MessagePortMain } from 'electron';

const isMainProcess = typeof ipcMain !== 'undefined';

export type DispatchedCallback = (...args: unknown[]) => unknown;

export interface DispatchedCallbackBody {
	dispatchedCallback: string;
}

export interface PortResponseBody {
	port: MessagePortMain;
}

export interface PortRendererResponseBody {
	port: MessagePort;
}

export interface InvokeRequestBody {
	method: string;
	args: unknown[];
}

export interface InstanceRequestBody {
	contract: string;
	specificHostId?: number;
}

export interface RegisterInstanceRequestBody {
	name: string;
}

export type UnregisterInstanceRequestBody = RegisterInstanceRequestBody;

export interface PortRequestBody extends RegisterInstanceRequestBody {
	id: number;
	remoteId: number;
}

export interface HostDeadNotificationRequestBody {
	id: number;
}

export enum IpcProtocol {
	HEADER_REQUEST_TYPE = 'request-type',
	HEADER_HOST_ID = 'host-id',
	HEADER_REQUEST_MODE = 'request-mode',

	MESSAGE_REGISTER_INSTANCE = 'host:register-instance',
	MESSAGE_UNREGISTER_INSTANCE = 'host:unregister-instance',
	MESSAGE_GET_INSTANCE = 'host:get-instance',
	MESSAGE_PORT_REQUEST = 'host:port-request',
	MESSAGE_HOST_DEAD_NOTIFICATION = 'host:host-dead-notification',

	MESSAGE_INVOKE = 'instance:invoke',
	MESSAGE_DISPOSE = 'instance:dispose',

	MESSAGE_EVENT_SUBSCRIBE = 'instance:event_subscribe',
	MESSAGE_EVENT_UNSUBSCRIBE = 'instance:event_unsubscribe',
	MESSAGE_EVENT_EMIT = 'instance:event_emit',
	MESSAGE_EVENT_NEXT = 'instance:event_next',
}

export enum IpcChannels {
	REQUEST_CHANNEL = 'ipc-remote:request',
	RESPONSE_CHANNEL = 'ipc-remote:response',
}

export function isDispatchedCallbackBody(body: unknown): body is DispatchedCallbackBody {
	return body !== null && typeof body === 'object' && 'dispatchedCallback' in body && typeof body.dispatchedCallback === 'string';
}

/**
 * Generic check that value is not just 'data',
 * but actually is behaviour if any of its properties is a function.
 */
function isServiceInstance(value: any): boolean {
	if (typeof value !== 'object' || value instanceof Array) {
		return false;
	}

	const properties = Object.getOwnPropertyDescriptors(value);

	// eslint-disable-next-line guard-for-in
	for (const key in properties) {
		const desc = properties[key];
		if (typeof desc.value === 'function') {
			return true;
		}
	}

	const proto: unknown = Object.getPrototypeOf(value);
	const ctor = (proto as { constructor?: unknown; })?.constructor;

	return typeof ctor === 'object' && ctor !== null && isServiceInstance(proto);
}

/**
 * Making value that must be sent out throug ipc services protocol.
 * Any function or service instance value will be transformed into remote-instance-info, all other values will no be modified
 */
export function makeOutboundValue(value: unknown, callbackFactory?: (callback: DispatchedCallback) => DispatchedCallbackBody): unknown {
	if (typeof value === 'function') {
		return callbackFactory ? callbackFactory(value as DispatchedCallback) : undefined;
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	if (!isMainProcess && value instanceof DOMException) {
		return Error(value.message);
	}

	if (!isServiceInstance(value)) {
		return value;
	}

	throw new Error('Should never be executed');
}

export function makeOutboundArgs(args: any[], callbackFactory: (callback: DispatchedCallback) => DispatchedCallbackBody): any[] {
	return args.map((arg) => { return makeOutboundValue(arg, callbackFactory); });
}

export function makeInboundArgs(args: unknown[], proxyCallbackFactory: (dispatchedCallback: DispatchedCallbackBody) => DispatchedCallback): unknown[] {
	return args.map(value => {
		if (isDispatchedCallbackBody(value)) {
			return proxyCallbackFactory(value);
		}

		return value;
	});
}
