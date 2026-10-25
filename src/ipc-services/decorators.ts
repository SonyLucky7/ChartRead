import 'reflect-metadata';

import { InstanceFactory, InstanceProvider } from '../ipc-remote';

// eslint-disable-next-line @typescript-eslint/ban-types
export type GenericConstructor<T = {}> = new (...args: any[]) => T;

export function ExposeSingletonService(contract: string, provider: InstanceProvider) {
	return (constructor: GenericConstructor): void => {
		const singletonFactory: InstanceFactory = (() => {
			let instance: unknown = null;

			return (...args: unknown[]): unknown => {
				if (args.length > 0) {
					console.error(`Service (${ constructor.name }) exposed as singleton and can not accept any construction arguments.`);
				}

				if (instance === null) {
					instance = new constructor();
				}
				return instance;
			};
		})();
		provider.registerFactory(contract, singletonFactory);
	};
}
