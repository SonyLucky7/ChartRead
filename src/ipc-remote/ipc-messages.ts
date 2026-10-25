import { IpcMessage } from './ipc-core';
import {
	HostDeadNotificationRequestBody,
	InstanceRequestBody,
	InvokeRequestBody,
	IpcProtocol,
	PortRequestBody,
	RegisterInstanceRequestBody,
	UnregisterInstanceRequestBody,
} from './ipc-protocol';

function baseRequest(body: unknown, requestType: IpcProtocol): IpcMessage {
	const message: IpcMessage = {
		headers: {
			[IpcProtocol.HEADER_REQUEST_TYPE]: requestType,
		},
		body,
	};

	return message;
}

export function registerInstanceRequest(requestData: RegisterInstanceRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_REGISTER_INSTANCE);
}

export function unregisterInstanceRequest(requestData: UnregisterInstanceRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_UNREGISTER_INSTANCE);
}

export function invokeRequest(requestData: InvokeRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_INVOKE);
}

export function portRequest(requestData: PortRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_PORT_REQUEST);
}

export function instanceRequest(requestData: InstanceRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_GET_INSTANCE);
}

export function emitEventRequest(requestData: InvokeRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_EVENT_EMIT);
}

export function disposeRequest(): IpcMessage {
	return baseRequest({}, IpcProtocol.MESSAGE_DISPOSE);
}

export function hostDeadNotificationRequest(requestData: HostDeadNotificationRequestBody): IpcMessage {
	return baseRequest(requestData, IpcProtocol.MESSAGE_HOST_DEAD_NOTIFICATION);
}
