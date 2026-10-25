import { Scheduler } from './task-queue';

export interface SchedulerProvider {
	getScheduler(): Scheduler;
}

export function scheduledCall(target: SchedulerProvider, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
	type GenericFunc = (...argd: unknown[]) => unknown;

	const originalFunc = descriptor.value as GenericFunc;
	if (originalFunc) {
		descriptor.value = function(...args: unknown[]): unknown {
			const scheduler: Scheduler = target.getScheduler.apply(this);

			const delayedCallWrapper = (): Promise<unknown> => {
				try {
					const promise = originalFunc.apply(this, args);
					if (promise instanceof Promise) {
						return promise;
					}

					return Promise.resolve(promise);
				}
				catch (error: unknown) {
					return Promise.reject(error);
				}
			};

			const id = typeof propertyKey === 'string' ? propertyKey : undefined;

			return scheduler.schedule<unknown>(delayedCallWrapper, id);
		};
	}

	return descriptor;
}
