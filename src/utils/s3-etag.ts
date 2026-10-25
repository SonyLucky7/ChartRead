const etagRegExp = /(?<weakMarker>(^W\/)?)"(?<value>.*)"/g;
const md5RegexExp = /^[a-f0-9]{32}$/gi;

function parseETag(rawETag: string): { value: string; weak: boolean; } {
	const etag = etagRegExp.exec(rawETag);
	const value = etag?.groups?.value ?? '';
	const weak = Boolean(etag?.groups?.weakMarker && etag?.groups?.weakMarker.length);

	etagRegExp.lastIndex = 0;

	return { value, weak };
}

export function extractMd5fromETag(rawETag: string): Buffer | null {
	const etag = parseETag(rawETag);

	if (etag.weak) {
		return null;
	}

	md5RegexExp.lastIndex = 0;
	if (!md5RegexExp.test(etag.value)) {
		return null;
	}

	return Buffer.from(etag.value, 'hex');
}
