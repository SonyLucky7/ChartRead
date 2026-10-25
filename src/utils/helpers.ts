export * from './platform';

export const dispatchBeforeUnload = (): boolean => {
	const evx = new Event('beforeunload', { cancelable: true, bubbles: true });
	Object.defineProperty(evx, 'returnValue', {
		configurable: true,
		writable: true,
		value: null,
	});
	window.dispatchEvent(evx);
	return evx.returnValue;
};

export function assertNumber(value: unknown): number {
	if (typeof value !== 'number') {
		throw new TypeError('[assertNumber] value is not a number');
	}
	return value;
}
