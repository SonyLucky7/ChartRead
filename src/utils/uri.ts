import * as url from 'url';

import { resolveEmbeddedLink } from '../navigation/navigation-rules';
import { DEFAULT_TAB_URL, NO_TAB_URL } from '../services/interfaces';

const localFileProtocols = new Set<string>(['file:', 'tvd:']);
const extensionProtocol = 'chrome-extension:';
const pdfViewerExtensionId = 'mhjfbmdgcfjbbpaeojofohoefgiehjai';
// eslint-disable-next-line prefer-regex-literals
const isWinDriveRegExp = new RegExp('^[a-zA-Z]:');

export const ERROR_VIEW_PATH = 'app/error-view';

export function makeFileURI(path: string): string {
	return url.pathToFileURL(path).toString();
}

export function isFileURI(path: string): boolean {
	return path.toLowerCase().startsWith('file');
}

export function isLocalURI(path: string): boolean {
	if (isWinDriveRegExp.test(path)) {
		return true;
	}

	let protocol = '';
	try {
		protocol = new URL(path).protocol;
	}
	catch {
		protocol = url.pathToFileURL(path).protocol;
	}

	return localFileProtocols.has(protocol);
}

/**
 * Chromium shows pdf documents with its built-in viewer, which is an extension.
 * Navigation rules know nothing about the viewer's uri, so it has to be allowed
 * explicitly, otherwise opening a pdf document gets prevented.
 */
export function isPdfViewerURI(path: string): boolean {
	try {
		const { protocol, hostname } = new URL(path);

		return protocol === extensionProtocol && hostname.toLowerCase() === pdfViewerExtensionId;
	}
	catch {
		return false;
	}
}

export function isValidUrl(path: string): boolean {
	try {
		const parsedUrl = new URL(path);

		if (parsedUrl.href) {
			return true;
		}
	}
	catch { }

	return false;
}

export function actualUrlHelper(currentUrl?: string, tabViewDefaultUrl?: string): string | undefined {
	if (!currentUrl) {
		return currentUrl;
	}

	const pseudoLink = resolveEmbeddedLink(currentUrl);
	if (pseudoLink) {
		return pseudoLink.path;
	}

	if (currentUrl === NO_TAB_URL) {
		return tabViewDefaultUrl;
	}

	if (currentUrl === DEFAULT_TAB_URL) {
		return tabViewDefaultUrl;
	}

	return currentUrl;
}
