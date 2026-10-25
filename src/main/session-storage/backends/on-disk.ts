import { AbstractLevel, AbstractSublevel } from 'abstract-level';
import { ClassicLevel } from 'classic-level';
import { join as pathJoin } from 'path';

import { loggerService } from '../../../logger';
import { getTvUserFolderPath } from '../../../providers/file-system-provider';
import { getMessageOfError } from '../../../tvd-runtime/core';
import { SessionData, SessionStorageBackend } from '../backends';
import * as leveldb from './leveldb';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- required by AbstractSublevel
type Sublevel = AbstractSublevel<
	AbstractLevel<string | Buffer | Uint8Array>,
	string | Buffer | Uint8Array,
	string,
	string
>;

const LOG_PREFIX = 'on-disk-storage';
function logError(error: unknown, clue: string): void {
	const errorMessage = getMessageOfError(error);
	loggerService().warn(`[${ LOG_PREFIX }] clue: ${ clue }, error: ${ errorMessage }`);
}
function logInfo(info: string): void {
	loggerService().warn(`[${ LOG_PREFIX }] ${ info }`);
}

function makeSessionStoragePath(userId: string): string {
	const SESSION_STORAGE_DIRECTORY = 'Session Storage';
	return pathJoin(getTvUserFolderPath(userId), SESSION_STORAGE_DIRECTORY);
}

export async function createOnDiskBackendForUser(userId: string): Promise<OnDiskBackend | null> {
	const path = makeSessionStoragePath(userId);

	const levelDb = await leveldb.tryOpenDb(path);
	if (levelDb !== null) {
		return new OnDiskBackend(levelDb);
	}

	logError('Unable to open levelDB', 'createOnDiskStorageForUser');
	return null;
}

export class OnDiskBackend implements SessionStorageBackend {
	private clearStorageExceptIds: Array<string> | null = null;
	private repairRequired = false;
	private corruptedLevels: Set<string> = new Set();
	private fullCleanScheduled: boolean = false;

	constructor(private readonly levelDb: ClassicLevel) {}

	// SessionStorageBackend interface start
	public async getSessionData(sessionId: string, origin: string): Promise<SessionData> {
		const sublevel = this.getFinalSublevel(sessionId, origin);
		try {
			return await sublevel.iterator().all();
		}
		catch (error) {
			logError(error, `getting namespace data for ${ sessionId }, ${ origin }`);
			if (leveldb.isCorruptionError(error)) {
				this.corruptedLevels.add(sublevel.prefix);
			}
			return [];
		}
	}

	public setItem(sessionId: string, origin: string, key: string, value: string): void {
		this.getFinalSublevel(sessionId, origin).put(key, value).catch((error) => {
			logError(error, `setItem ${ sessionId }, ${ origin }, ${ key }`);
		});
	}

	public removeItem(sessionId: string, origin: string, key: string): void {
		this.getFinalSublevel(sessionId, origin).del(key).catch((error) => {
			logError(error, `removeItem ${ sessionId }, ${ origin }, ${ key }`);
		});
	}

	public clearItems(sessionId: string, origin: string): void {
		this.getFinalSublevel(sessionId, origin).clear().catch((error) => {
			logError(error, `clear ${ sessionId }, ${ origin }`);
		});
	}

	public async cloneSession(sessionId: string, clonnedSessionId: string): Promise<void> {
		if (sessionId === clonnedSessionId) {
			return;
		}

		const source = this.levelDb.sublevel(sessionId);
		const destination = this.levelDb.sublevel(clonnedSessionId);

		let entries;
		try {
			// Sublevel iteration strips only the parent's prefix; nested
			// `origin` sublevel separators remain in `innerKey`, so re-putting
			// them under the destination sublevel preserves the origin nesting.
			entries = await source.iterator().all();
			if (entries.length === 0) {
				return;
			}
		}
		catch (error) {
			logError(error, `duplicating from ${ sessionId }`);
			if (leveldb.isCorruptionError(error)) {
				this.corruptedLevels.add(source.prefix);
			}
			return;
		}

		try {
			await destination.batch(entries.map(([key, value]) => ({ type: 'put' as const, key, value })));
		}
		catch (error) {
			logError(error, `duplicating to ${ clonnedSessionId }`);
			if (leveldb.isCorruptionError(error)) {
				this.corruptedLevels.add(source.prefix);
			}
		}
	}

	public deleteSessions(sessionIds: Set<string>): void {
		for (const id of sessionIds) {
			this.levelDb.sublevel(id).clear().catch((error) => {
				logError(error, `clearIds on id: ${ id }`);
				if (leveldb.isCorruptionError(error)) {
					this.repairRequired = true;
				}
			});
		}
	}

	public keepSessionsDuringFullCleanup(keepIds: Array<string>): void {
		this.clearStorageExceptIds = this.clearStorageExceptIds === null ? keepIds : [...this.clearStorageExceptIds, ...keepIds];
	}

	public scheduleFullCleanupAtDispose(): void {
		this.fullCleanScheduled = true;
	}

	public async dispose(): Promise<void> {
		if (this.fullCleanScheduled) {
			await this.collectGarbage();
			await this.compactDb();
		}
		try {
			await this.levelDb.close();
		}
		catch (error) {
			logError(error, 'DB close');
			return;
		}

		if (this.repairRequired || this.corruptedLevels.size !== 0) {
			try {
				await ClassicLevel.repair(this.levelDb.location);
				logInfo(`dispose-time repair completed at ${ this.levelDb.location }`);
			}
			catch (error) {
				logError(error, 'dispose repair');
			}
		}
	}
	// SessionStorageBackend interface end

	private getFinalSublevel(sessionId: string, origin: string): Sublevel {
		return this.levelDb.sublevel(sessionId).sublevel(origin);
	}

	private async collectGarbage(): Promise<void> {
		if (this.clearStorageExceptIds === null) {
			return;
		}

		if (this.clearStorageExceptIds.length === 0) {
			try {
				await this.levelDb.clear();
			}
			catch (error) {
				logError(error, 'collectGarbage. no ids to keep, clearing whole DB');
				this.repairRequired = true;
			}
			return;
		}

		const keepIds = new Set(this.clearStorageExceptIds);
		const allIds = await this.collectTopLevelIds();

		for (const id of allIds) {
			if (keepIds.has(id)) {
				continue;
			}
			try {
				await this.levelDb.sublevel(id).clear();
			}
			catch (error) {
				logError(error, 'collectGarbage, cleaning');
				if (leveldb.isCorruptionError(error)) {
					this.repairRequired = true;
					return;
				}
			}
		}
	}

	// abstract-level sublevels are pure key-prefix namespaces. Top-level ids
	// have no separate existence record - the only way to enumerate them is
	// to scan the root keyspace and harvest unique `!<id>!...` prefixes.
	//
	// To avoid an O(N) full key scan, we use the abstract-level convention
	// for the upper bound of a sublevel's keyspace: `!<id>!` ... `!<id>"`,
	// where `"` (0x22) is the byte immediately after the separator `!` (0x21).
	// This matches `globalUpperBound` in abstract-level/lib/abstract-sublevel.js
	// and is encoding-stable (pure ASCII, valid in utf8/buffer/view).
	//
	// Once we observe a sublevel's first key, we seek past its entire range
	// to the next sublevel's first key. Cost drops from O(keys) to O(sublevels).
	private async collectTopLevelIds(): Promise<Set<string>> {
		const SEP = '!';
		const MIN_KEY_OFFSET = 4;
		const RESERVED = String.fromCharCode(SEP.charCodeAt(0) + 1); // '"'
		const ids = new Set<string>();
		const it = this.levelDb.keys();
		try {
			let key = await it.next();
			while (key !== undefined) {
				if (key.length >= MIN_KEY_OFFSET && key.charCodeAt(0) === SEP.charCodeAt(0)) {
					const end = key.indexOf(SEP, 1);
					if (end > 1) {
						const id = key.substring(1, end);
						ids.add(id);
						// Jump past the entire `!id!*` range. The next key returned
						// will be the first key of the next sublevel (or undefined).
						it.seek(SEP + id + RESERVED);
					}
				}
				key = await it.next();
			}
		}
		catch (error) {
			logError(error, 'scanning top level ids');
		}
		return ids;
	}

	private async compactDb(): Promise<void> {
		try {
			const first = await this.levelDb.keys({ limit: 1 }).next();
			const last = await this.levelDb.keys({ limit: 1, reverse: true }).next();
			if (first === undefined || last === undefined) {
				return;
			}
			logInfo(`Compacting DB by range ${ first } - ${ last }`);
			await this.levelDb.compactRange(first, last);
		}
		catch (error) {
			logError(error, 'compactDb');
			if (leveldb.isCorruptionError(error)) {
				this.repairRequired = true;
			}
		}
	}
}
