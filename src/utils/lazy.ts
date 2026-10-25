export function lazy<T>(factory: () => T): (() => T) {
	let factory_: (typeof factory) | undefined = factory;
	let value: T | undefined;

	return (): T => {
		if (factory_) {
			const f = factory_;
			factory_ = undefined;
			value = f();
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return value!;
	};
}
