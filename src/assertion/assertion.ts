import { getConfiguration } from '../services/configuration';

const isDev = getConfiguration().advanced.debugMode;

let failFast = (error: Error): void => {
	console.error(error);
	process.abort();
};

export function setupFailFast(func: (error: Error) => void): void {
	failFast = func;
}

export function assertNotNull<T>(value: T | null): asserts value is T {
	assert(value !== null, 'Value is null!');
}

export function assert(condition: boolean, msg: string): asserts condition {
	if (condition) {
		return;
	}

	const error = Error(`Assertion failed: ${ msg }`);

	if (!isDev) {
		throw error;
	}

	failFast(error);
}
