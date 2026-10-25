import { ClassicLevel } from 'classic-level';

import { loggerService } from '../../../logger';
import { getMessageOfError } from '../../../tvd-runtime/core';

const LOG_PREFIX = 'leveldb-support';
function logError(error: unknown, clue: string): void {
	const errorMessage = getMessageOfError(error);
	loggerService().warn(`[${ LOG_PREFIX }] clue: ${ clue }, error: ${ errorMessage }`);
}

export async function tryOpenDb(path: string): Promise<ClassicLevel | null> {
	// 1. Plain open.
	try {
		const db = new ClassicLevel<string, string>(path);
		await db.open();
		return db;
	}
	catch (openError) {
		const { code, isCorruption } = classifyError(openError);

		// LEVEL_LOCKED: another process / stale lock holds the DB.
		// Repairing or renaming would yank state from under the holder. Bail.
		if (code === 'LEVEL_LOCKED') {
			logError(openError, `DB at ${ path } is locked, refusing repair/rename`);
			return null;
		}

		// Anything other than corruption / IO error: repair won't help. Bail.
		if (!isCorruption) {
			logError(openError, 'DB open failed with non-recoverable error');
			return null;
		}

		logError(openError, 'DB open failed with corruption, trying repair');
	}

	// 2. Repair + reopen.
	try {
		await ClassicLevel.repair(path);
		const db = new ClassicLevel<string, string>(path);
		await db.open();
		return db;
	}
	catch (repairError) {
		logError(repairError, 'repair failed, trying rename+reopen');
	}

	// 3. Rename corrupted dir aside + fresh open.
	try {
		await ClassicLevel.destroy(path);
		const db = new ClassicLevel<string, string>(path);
		await db.open();
		return db;
	}
	catch (nukeError) {
		logError(nukeError, 'rename+reopen failed');
	}

	return null;
}

// TOFIX(Artem): need test for it mainly to detect that errors changed in library
/**
* if error is unknown we treat it as corruption error
*/
export function isCorruptionError(error: unknown): boolean {
	if (error == null || typeof error !== 'object' || !('code' in error)) {
		return true;
	}
	const code = String((error as { code?: unknown; }).code);

	return code === 'LEVEL_CORRUPTION' || code === 'LEVEL_IO_ERROR';
}

export function classifyError(err: unknown): {
	code: string;
	isCorruption: boolean;
	isLifecycle: boolean;
	isProgrammerError: boolean;
} {
	if (!err || typeof err !== 'object' || !('code' in err)) {
		return {
			code: '',
			isCorruption: false,
			isLifecycle: false,
			isProgrammerError: false,
		};
	}

	const code = String((err as { code?: unknown; }).code);

	const isCorruption = code === 'LEVEL_CORRUPTION' || code === 'LEVEL_IO_ERROR';
	const isLifecycle = code === 'LEVEL_DATABASE_NOT_OPEN' || code === 'LEVEL_DATABASE_NOT_CLOSED' || code === 'LEVEL_LOCKED';
	const isProgrammerError =
		code === 'LEVEL_INVALID_KEY' ||
		code === 'LEVEL_INVALID_VALUE' ||
		code === 'LEVEL_READONLY' ||
		code === 'LEVEL_ITERATOR_BUSY' ||
		code === 'LEVEL_ITERATOR_NOT_OPEN' ||
		code === 'LEVEL_ENCODING_NOT_FOUND' ||
		code === 'LEVEL_ENCODING_NOT_SUPPORTED';

	return {
		code,
		isCorruption,
		isLifecycle,
		isProgrammerError,
	};
}
