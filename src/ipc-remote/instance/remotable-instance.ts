import { Subscribable, Unsubscribable } from 'rxjs';

import { ignorePromise } from '../../utils';
import { hasHeader, headerValue, IpcRequest, response, responseFailure } from '../ipc-core';
import { emitEventRequest } from '../ipc-messages';
import { DispatchedCallbackBody, InvokeRequestBody, IpcProtocol, makeInboundArgs, makeOutboundValue } from '../ipc-protocol';
import { Communicator, RequestMode } from '../transport/communicator';

type Nextable = { next(value: unknown): void; };
type AnyFunction = (...args: unknown[]) => unknown;

function isFunction(value: unknown): value is AnyFunction {
	return typeof value === 'function';
}

export class RemotableInstance {
	readonly id: string;
	private readonly instance: Record<string, unknown>;
	private readonly communicatorsByRemoteId: Map<number, Communicator> = new Map();
	private readonly eventSubscriptions: Map<string, Unsubscribable> = new Map();

	static wrapIntstanceToRemotable(instance: Record<string, unknown>, id: string): RemotableInstance {
		return new RemotableInstance(instance, id);
	}

	private constructor(instance: Record<string, unknown>, name: string) {
		this.id = name;
		this.instance = instance;
	}

	addCommunicator(communicator: Communicator): void {
		this.communicatorsByRemoteId.set(communicator.remoteId, communicator);

		communicator.onClosed.subscribe(() => {
			communicator.dispose();
			// todo: remove from array
		});

		communicator.onRequest.subscribe((request: IpcRequest) => {
			try {
				this.handleRequest(request);
			}
			catch (error) {
				responseFailure(request, error);
			}
		});
	}

	onHostDead(deadHostId: number): void {
		const idsForDelete: string[] = [];
		for (const [id, sub] of this.eventSubscriptions) {
			if (id.split('-').at(0) === deadHostId.toString()) {
				sub.unsubscribe();
				idsForDelete.push(id);
			}
		}

		idsForDelete.forEach(id => {
			this.eventSubscriptions.delete(id);
		});

		this.communicatorsByRemoteId.get(deadHostId)?.dispose();
		this.communicatorsByRemoteId.delete(deadHostId);
	}

	private handleRequest(request: IpcRequest): void {
		if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_INVOKE)) {
			return this.handleInvokeRequest(request);
		}

		if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_DISPOSE)) {
			return this.handleDisposeRequest(request);
		}

		if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_EVENT_SUBSCRIBE)) {
			return this.handleSubscribeRequest(request);
		}

		if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_EVENT_UNSUBSCRIBE)) {
			return this.handleUnsubscribeRequest(request);
		}

		if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_EVENT_NEXT)) {
			return this.handleNextRequest(request);
		}
	}

	private handleInvokeRequest(request: IpcRequest): void {
		const invoke = request.body as InvokeRequestBody;
		const args = makeInboundArgs(invoke.args, (dispatchedCallback) => {
			const hostId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0;

			return (...callbackArgs: unknown[]): unknown => {
				const requestPromise = this.communicatorsByRemoteId.get(hostId)?.request(emitEventRequest({
					method: dispatchedCallback.dispatchedCallback,
					args: callbackArgs,
				}), RequestMode.FireAndForget);

				return requestPromise;
			};
		});

		const method = this.instance[invoke.method];

		if (typeof method === 'undefined') {
			responseFailure(request, `Instance does not provide invocable property: (${ invoke.method })`);
			return;
		}

		const result = (method as (...values: unknown[]) => unknown).apply(this.instance, args);
		if (result instanceof Promise) {
			return this.chainPromise(request, result);
		}

		this.respondWithResult(request, result);
	}

	private handleDisposeRequest(request: IpcRequest): void {
		const remoteId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0;

		this.onHostDead(remoteId);
	}

	private handleSubscribeRequest(request: IpcRequest): void {
		const invoke = request.body as InvokeRequestBody;
		const subscribable = Reflect.get(this.instance, invoke.method) as Subscribable<unknown>;
		if (!subscribable) {
			throw new Error(`Invalid (${ invoke.method }) event`);
		}

		const hostId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID) ?? 0;
		const id = `${ hostId }-${ invoke.method }`;
		const subscription = subscribable.subscribe({
			next: (value: unknown) => {
				const requestPromise = this.communicatorsByRemoteId.get(hostId)?.request(emitEventRequest({
					method: invoke.method,
					args: [value],
				}), RequestMode.FireAndForget);

				if (requestPromise) {
					ignorePromise(requestPromise);
				}
			},

			error: (error: unknown) => {
				console.error(error);
			},
		});

		if (this.eventSubscriptions.has(id)) {
			return responseFailure(request, 'Instance already have such subscription');
		}

		this.eventSubscriptions.set(id, subscription);

		response(request, {});
	}

	private handleUnsubscribeRequest(request: IpcRequest): void {
		const invoke = request.body as InvokeRequestBody;
		const remoteId = headerValue<number>(request, IpcProtocol.HEADER_HOST_ID);
		const id = `${ remoteId ?? 0 }-${ invoke.method }`;
		const sub = this.eventSubscriptions.get(id);
		sub?.unsubscribe();
		this.eventSubscriptions.delete(id);

		response(request, {});
	}

	private handleNextRequest(request: IpcRequest): void {
		const invoke = request.body as InvokeRequestBody;
		const source = Reflect.get(this.instance, invoke.method) as Nextable;
		source.next(invoke.args[0]);

		response(request, {});
	}

	private responseWithDispatchedCallback(request: IpcRequest, value: ((...args: unknown[]) => unknown)): void {
		if (!value.name) {
			return responseFailure(request, 'Dispatched callback must be named');
		}

		if (!this.instance[value.name]) {
			this.instance[value.name] = value;
		}

		const dispatchedCallbackResponse: DispatchedCallbackBody = {
			dispatchedCallback: value.name,
		};

		return response(request, makeOutboundValue(dispatchedCallbackResponse));
	}

	private chainPromise(request: IpcRequest, promise: Promise<unknown>): void {
		promise
			.then(value => { this.respondWithResult(request, value); })
			.catch(error => responseFailure(request, error));
	}

	private respondWithResult(request: IpcRequest, result: unknown): void {
		if (isFunction(result)) {
			return this.responseWithDispatchedCallback(request, result);
		}

		return response(request, makeOutboundValue(result));
	}

	dispose(): void {
		for (const communicator of this.communicatorsByRemoteId.values()) {
			communicator.dispose();
		}
	}
}
