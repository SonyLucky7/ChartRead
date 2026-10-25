export interface IpcMessage {
	headers: { [key: string]: any; };
	body: unknown;
}

export type IpcResponse = IpcMessage;

export interface IpcRequest extends IpcMessage {
	responseChannel(value: IpcMessage): void;
	port?: MessagePort;
}

export function hasHeader(message: IpcMessage, key: string, value?: unknown): boolean {
	if (key in message.headers) {
		return value === undefined || message.headers[key] === value;
	}

	return false;
}

export function headerValue<T>(message: IpcMessage, key: string): T | undefined {
	return key in message.headers ? message.headers[key] as T : undefined;
}

export function response(request: IpcRequest, value: unknown): void {
	const responseMessage: IpcMessage = {
		headers: {
			...request.headers,
			success: true,
			failure: '',
		},
		body: value,
	};

	request.responseChannel(responseMessage);
}

export function responseFailure(request: IpcRequest, error: string | any): void {
	let message = '';
	let stack: string | undefined;
	if (typeof error == 'string') {
		message = error;
	}
	else if (error instanceof Error) {
		message = `(${ error.name }):${ error.message }`;
		stack = error.stack;
	}
	else {
		message = 'Untyped error';
	}

	const responseMessage: IpcMessage = {
		headers: {
			...request.headers,
			success: false,
			failure: message,
		},
		body: {},
	};

	if (stack) {
		responseMessage.headers.stack = stack;
	}

	request.responseChannel(responseMessage);
}

export function throwIfNonTransferable(message: IpcMessage): void {
	structuredClone(message);
}

export function rethrowIfException(message: IpcMessage): void {
	if (!hasHeader(message, 'success')) {
		throw new Error('Expected response message.');
	}

	if (message.headers.success) {
		return;
	}

	if (message.headers.failure && typeof message.headers.failure === 'string') {
		const error = new Error(message.headers.failure);
		if ('stack' in message.headers) {
			error.stack = message.headers.stack as string;
		}
		throw error;
	}

	throw new Error('Unspecified remoting error');
}

export function getResponseBody<T = any>(message: IpcMessage): T {
	rethrowIfException(message);
	return message.body as T;
}
