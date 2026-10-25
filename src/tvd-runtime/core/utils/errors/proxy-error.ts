export class ProxyError extends Error {
	constructor(m: string) {
		super(m);
		Object.setPrototypeOf(this, ProxyError.prototype);
	}
}
