type AppRepositoryType = 'ms-store' | 'debian' | 'other';

export function appRepositoryType(): AppRepositoryType {
	/* eslint-disable @typescript-eslint/ban-ts-comment */
	return 'other';
	/* eslint-enable @typescript-eslint/ban-ts-comment */
}

export function isMSStore(): boolean {
	return appRepositoryType() === 'ms-store';
}

export function isDebian(): boolean {
	return appRepositoryType() === 'debian';
}
