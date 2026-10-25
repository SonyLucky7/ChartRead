// eslint-disable-next-line @typescript-eslint/ban-types
export type GenericConstructor<T = {}> = new (...args: any[]) => T;

export function getMessageOfError(error: unknown): string {
	if (error === null || typeof error === 'undefined') {
		return '';
	}

	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (typeof error === 'object') {
		return (error as { message?: string; }).message ?? 'unknown error';
	}

	return 'unknown error';
}
