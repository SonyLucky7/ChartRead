import { SessionData, SessionStorageBackend } from './backend';

export class InMemoryBackend implements SessionStorageBackend {
	private readonly namespaces = new Map<string, Map<string, Map<string, string>>>();

	public getSessionData(sessionId: string, origin: string): Promise<SessionData> {
		const origins = this.namespaces.get(sessionId);
		const entries = origins?.get(origin);
		if (!entries) {
			return Promise.resolve([]);
		}
		return Promise.resolve(Array.from(entries.entries()));
	}

	public setItem(sessionId: string, origin: string, key: string, value: string): void {
		let origins = this.namespaces.get(sessionId);
		if (!origins) {
			origins = new Map();
			this.namespaces.set(sessionId, origins);
		}
		let entries = origins.get(origin);
		if (!entries) {
			entries = new Map();
			origins.set(origin, entries);
		}
		entries.set(key, value);
	}

	public removeItem(sessionId: string, origin: string, key: string): void {
		this.namespaces.get(sessionId)?.get(origin)?.delete(key);
	}

	public clearItems(sessionId: string, origin: string): void {
		this.namespaces.get(sessionId)?.delete(origin);
	}

	public deleteSessions(sessionIds: Set<string>): void {
		for (const sessionId of sessionIds) {
			this.namespaces.delete(sessionId);
		}
	}

	public cloneSession(sessionId: string, clonnedSessionId: string): Promise<void> {
		if (sessionId === clonnedSessionId) {
			return Promise.resolve();
		}
		const source = this.namespaces.get(sessionId);
		if (!source) {
			this.namespaces.delete(clonnedSessionId);
			return Promise.resolve();
		}
		const copy = new Map<string, Map<string, string>>();
		for (const [origin, entries] of source) {
			copy.set(origin, new Map(entries));
		}
		this.namespaces.set(clonnedSessionId, copy);
		return Promise.resolve();
	}
}
