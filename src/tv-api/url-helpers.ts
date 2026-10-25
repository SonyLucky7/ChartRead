import { resolve } from 'url';

import { getConfiguration } from '../services/configuration';

export function resolveWebsiteRoot(path: string): string {
	const domain = getConfiguration().urls.defaultHost;
	return resolve(domain, path);
}

export function resolveAuthenticationRoot(path: string): string {
	const domain = getConfiguration().urls.authHost;
	return resolve(domain, path);
}
