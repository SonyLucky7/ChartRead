import { Subject, Unsubscribable } from 'rxjs';

import { loggerService } from '../logger';
import { getMessageOfError } from '../tvd-runtime/core';
import { ignorePromise } from '../utils/async';
import { getResponseBody, hasHeader } from './ipc-core';
import { disposeRequest } from './ipc-messages';
import { DispatchedCallback, DispatchedCallbackBody, InvokeRequestBody, IpcProtocol, isDispatchedCallbackBody, makeInboundArgs, makeOutboundArgs } from './ipc-protocol';
import { Promisify } from './promisify';
import { Communicator, RequestMode } from './transport/communicator';

const ignoredMethods = ['then', 'reject'];
const proxyMethods = ['dispose'];

function ignoreProxyMethod(name: string): boolean {
	return ignoredMethods.includes(name);
}

function isProxyMethod(name: string): boolean {
	return proxyMethods.includes(name);
}

interface IpcProxyState {
	communicatorPromise: Promise<Communicator>;
	subscriptionEmitters: Record<string, DispatchedCallback>;
}

interface ProxyFieldContext {
	proxy: IpcProxyState;
	fieldData: Record<string, unknown>; // this property dedicated to store data per field. Each property keep its data into this field context.field
	propKey: string;
}

class ProxyEventSubscription {
	readonly source = new Subject<unknown>();
	readonly observable = this.source.asObservable();
}

async function remoteInvoke__<T = unknown>(communicator: Communicator, method: string, messageType: string, mode: RequestMode, args: any[]): Promise<T> {
	const body: InvokeRequestBody = {
		method,
		args,
	};

	try {
		const response = await communicator.request({
			headers: {
				[IpcProtocol.HEADER_REQUEST_TYPE]: messageType,
			},
			body,
		}, mode);

		return getResponseBody<T>(response);
	}
	catch (error) {
		loggerService().error('Error remote invoke', error);
		throw error;
	}
}

export function remoteInvoke<T = unknown>(communicator: Communicator, method: string, args: any[]): Promise<T> {
	return remoteInvoke__<T>(communicator, method, IpcProtocol.MESSAGE_INVOKE, RequestMode.WaitForResponse, args);
}

/**
 * IpcProxy is a wrapper for remote instance service.
 * IpcProxy instance will implement ProxyHandler<>.get() that returns field value represented as IpcPropertyProxy.
 * For example:
 *
 * const instance = ... // IpcProxy;
 *
 * instance.callFunction(arg); // -> IpcProxy.get() returns IpcPropertyProxy and then call IpcPropertyProxy.apply(...) method for it;
 *
 * instance.myEvent.subscribe(...); // -> IpcProxy.get() returns IpcPropertyProxy and then call IpcPropertyProxy.get(...) method for it
 *  with in turns return proxy-call-wrapper for subscribe method.
 *
 */
class IpcPropertyProxy implements ProxyHandler<ProxyFieldContext> {
	private static makeSubscribe(context: ProxyFieldContext): (...args: unknown[]) => Unsubscribable {
		if (!(context.propKey in context.fieldData)) {
			Object.defineProperty(context.fieldData, context.propKey, {
				writable: false,
				configurable: true,
				value: new ProxyEventSubscription(),
			});
		}

		return (...args: unknown[]): Unsubscribable => {
			type GenericSubscribeable = { subscribe(...a: unknown[]): Unsubscribable; };
			const eventSubscription: ProxyEventSubscription = Reflect.get(context.fieldData, context.propKey) as ProxyEventSubscription;
			const subscription: Unsubscribable = (<GenericSubscribeable>eventSubscription.observable).subscribe(...args);

			if (!context.proxy.subscriptionEmitters[context.propKey]) {
				context.proxy.subscriptionEmitters[context.propKey] = (value: unknown) => {
					const eventSource = (Reflect.get(context.fieldData, context.propKey) as ProxyEventSubscription).source;
					eventSource.next(value);
				};
			}

			ignorePromise((async(): Promise<void> => {
				const communicator = await context.proxy.communicatorPromise;
				await remoteInvoke__(communicator, context.propKey, IpcProtocol.MESSAGE_EVENT_SUBSCRIBE, RequestMode.FireAndForget, []);
			})());

			return {
				unsubscribe: () => {
					subscription.unsubscribe();
					ignorePromise(context.proxy.communicatorPromise.then(communicator => {
						ignorePromise(remoteInvoke__(communicator, context.propKey, IpcProtocol.MESSAGE_EVENT_UNSUBSCRIBE, RequestMode.FireAndForget, []));
					}));
				},
			};
		};
	}

	async apply(target: ProxyFieldContext, this_: any, args: any[]): Promise<any> {
		const communicator = await target.proxy.communicatorPromise;
		const outboundArgs = makeOutboundArgs(args, (callback) => {
			const dispatchedCallbackBody: DispatchedCallbackBody = { dispatchedCallback: callback.name };
			target.proxy.subscriptionEmitters[callback.name] = callback;

			return dispatchedCallbackBody;
		});

		const result = await remoteInvoke(communicator, target.propKey, outboundArgs);

		if (isDispatchedCallbackBody(result)) {
			return (...callbackArgs: unknown[]): Promise<unknown> => {
				return remoteInvoke(communicator, result.dispatchedCallback, callbackArgs);
			};
		}

		return result;
	}

	get(context: ProxyFieldContext, propKey: string): any {
		if (propKey === 'subscribe') {
			return IpcPropertyProxy.makeSubscribe(context);
		}
		if (propKey === 'next') {
			return (value: unknown) => {
				ignorePromise(context.proxy.communicatorPromise.then(communicator => {
					ignorePromise(remoteInvoke__(communicator, context.propKey, IpcProtocol.MESSAGE_EVENT_NEXT, RequestMode.FireAndForget, [value]));
				}));
			};
		}

		throw new Error(`Unknown ipc-proxy property: (${ propKey })`);
	}
}

const ipcPropertyProxyHandler__ = new IpcPropertyProxy();

export class IpcProxy implements ProxyHandler<Record<string, unknown>>, IpcProxyState {
	private readonly properties: Record<string, unknown> = {};
	readonly subscriptionEmitters: Record<string, (...args: unknown[]) => void> = {};

	static create<T>(communicatorPromise: Promise<Communicator>): Promisify<T> {
		const proxyHandler = new IpcProxy(communicatorPromise);
		const proxy = new Proxy({}, proxyHandler) as Promisify<T>;
		return proxy;
	}

	constructor(readonly communicatorPromise: Promise<Communicator>) {
		this.communicatorPromise.then(communicator => {
			communicator.onRequest.subscribe((request) => {
				if (hasHeader(request, IpcProtocol.HEADER_REQUEST_TYPE, IpcProtocol.MESSAGE_EVENT_EMIT)) {
					const invoke = request.body as InvokeRequestBody;
					const args = makeInboundArgs(invoke.args, (dispatchedCallback): DispatchedCallback => {
						throw new Error(`Dispatched callbacks in Rx Observables not allowed. Requested callback - ${ dispatchedCallback.dispatchedCallback }`);
					});

					const prop = this.subscriptionEmitters[invoke.method];
					if (!prop) {
						return;
					}

					prop(...args);
				}
			});
		}).catch((error: unknown) => {
			const message = getMessageOfError(error);
			console.warn(`Error while awaiting communicator instance on constructor:${ message }`);
		});
	}

	get(context: Record<string, unknown>, propKey: string): unknown {
		if (ignoreProxyMethod(propKey)) {
			return undefined;
		}

		if (isProxyMethod(propKey) && propKey in this) {
			return ((this as Record<string, unknown>)[propKey] as (...args: unknown[]) => unknown).bind(this);
		}

		const prop = this.properties[propKey];
		if (prop) {
			return prop;
		}

		const fieldInfo: ProxyFieldContext = {
			proxy: this,
			fieldData: context,
			propKey,
		};

		// proxy context must be a function, to allow using handler 'apply'.
		const propTarget = Object.assign(() => { }, fieldInfo);
		const propProxy = new Proxy(propTarget, ipcPropertyProxyHandler__);
		this.properties[propKey] = propProxy;

		return propProxy;
	}

	has(target: unknown, propKey: string): boolean {
		if (ignoreProxyMethod(propKey)) {
			return false;
		}
		return isProxyMethod(propKey);
	}

	async apply(target_: unknown, this_: unknown, args: unknown[]): Promise<unknown> {
		const communicator = await this.communicatorPromise;
		const result = await remoteInvoke(communicator, '', args);

		return result;
	}

	dispose(): void {
		this.communicatorPromise.then(communicator => {
			communicator.request(disposeRequest(), RequestMode.FireAndForget).finally(() => communicator.dispose());
		}).catch((error: unknown) => {
			const message = getMessageOfError(error);
			console.warn(`Error while awaiting communicator instance on .dispose:${ message }`);
		});
	}
}
