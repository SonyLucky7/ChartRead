export { };

declare global {
	interface Array<T> {
		except(items: T[]): T[];
		move(fromIndex: number, toIndex: number): T[];
	}
}

if (!Array.prototype.except) {
	// eslint-disable-next-line no-extend-native
	Array.prototype.except = function <T>(this: T[], items: T[]): T[] {
		return this.filter(i => !items.includes(i));
	};
}

if (!Array.prototype.move) {
	// eslint-disable-next-line no-extend-native
	Array.prototype.move = function <T>(this: T[], fromIndex: number, toIndex: number): T[] {
		if (fromIndex < 0 || fromIndex > this.length - 1) {
			throw new Error('[Array.move] fromIndex out from array range');
		}

		if (toIndex < 0 || toIndex > this.length - 1) {
			throw new Error('[Array.move] toIndex out from array range');
		}

		const element = this[fromIndex];
		this.splice(fromIndex, 1);
		this.splice(toIndex, 0, element);
		return this;
	};
}
