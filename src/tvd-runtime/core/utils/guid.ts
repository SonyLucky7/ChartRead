import { uuid } from 'uuidv4';

// eslint-disable-next-line no-useless-escape
const uidTemplate = /([0-9A-F]){8}\-([0-9A-F]){4}\-([0-9A-F]){4}\-([0-9A-F]){4}\-([0-9A-F]){12}/;

export function getUID(): string {
	return uuid();
}

export function isUID(id: string): boolean {
	const res = uidTemplate.exec(id);
	return res !== null && res.length > 0;
}

export function getUIDLength(): number {
	return getUID().length;
}
