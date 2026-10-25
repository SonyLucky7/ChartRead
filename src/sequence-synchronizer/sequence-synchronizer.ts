type Callback<T> = (accumulator: Set<T>) => void | PromiseLike<void>;

export class SequenceSynchronizer<T> {
	private readonly accumulator: Set<T> = new Set();
	private timeout: NodeJS.Timeout | null = null;
	private endBefore: number | null = null;

	constructor(private callback: Callback<T>, private readonly shiftMs = 50, private readonly timeoutMs = 1000) {
		if (this.shiftMs < this.timeoutMs) {
			return;
		}

		throw new Error('Assertion shiftMs < timeoutMs failed');
	}

	sync(object: T): void {
		this.accumulator.add(object);

		if (this.timeout) {
			if (this.endBefore && this.endBefore < Date.now()) {
				this.fire();
				return;
			}
			this.timeout.refresh();
			return;
		}

		this.endBefore = Date.now() + this.timeoutMs;
		this.timeout = setTimeout(this.fire.bind(this), this.shiftMs);
	}

	private fire(): void {
		(async() => {
			try {
				const maybePromise = this.callback(this.accumulator);

				if (maybePromise instanceof Promise) {
					await maybePromise;
				}
			}
			finally {
				this.reset();
			}
		})();
	}

	private reset(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
			this.endBefore = null;
		}

		this.accumulator.clear();
	}
}
