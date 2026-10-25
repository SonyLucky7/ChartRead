import { Subject } from 'rxjs';

import { IUndo } from '../services/interfaces';
import { IPersistentObject, IPersistentObjectImplementation, PersistentObject } from '../tvd-runtime/core/persistence/persistence';
import { UndoEntry } from './undo-entry';

// export type UndoHandler = (context: any, data: unknown) => void;
export interface UndoHandler {
	undo(what: string, data: unknown): void;
	undoItemDescription(what: string, data: unknown): string;
}

export interface UndoHandlersItem {
	command: string;
	handler: UndoHandler;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UndoStack extends IPersistentObject { }

@PersistentObject
export class UndoStack implements IPersistentObjectImplementation, IUndo {
	private static readonly handlers: UndoHandlersItem[] = [];
	readonly context: any;
	#entries: UndoEntry[] = [];
	private readonly undoMaxSize: number;

	private readonly entriesChangeEvent = new Subject<void>();
	readonly entriesChange = this.entriesChangeEvent.asObservable();

	static registerUndoHandler(command: string, handler: UndoHandler): void {
		UndoStack.handlers.push({ command, handler });
	}

	static undoItemDescription(entry: UndoEntry): string {
		const handler = UndoStack.handlers.find(h => h.command === entry.command)?.handler;
		return handler ? handler.undoItemDescription(entry.command, entry.data) : 'undo';
	}

	constructor(context: unknown, maxSize: number) {
		this.context = context;
		this.undoMaxSize = maxSize;
	}

	get top(): UndoEntry | undefined {
		return this.#entries.length > 0 ? this.#entries[this.#entries.length - 1] : undefined;
	}

	public get entries(): ReadonlyArray<UndoEntry> {
		return this.#entries;
	}

	push(entry: UndoEntry): UndoEntry | undefined {
		let droppedEntry: UndoEntry | undefined;
		if (this.#entries.length === this.undoMaxSize) {
			droppedEntry = this.#entries.shift();
		}

		this.#entries.push(entry);
		this.notifyStateChanged();
		this.entriesChangeEvent.next();
		return droppedEntry;
	}

	undo(): void {
		const entry = this.#entries.pop();
		if (!entry) {
			return;
		}

		const handler = UndoStack.handlers.find(h => h.command === entry.command)?.handler;
		if (!handler) {
			const message = `Unregistered undo action (${ entry.command })`;
			throw new Error(message);
		}

		try {
			handler.undo(entry.command, entry.data);
		}
		finally {
			this.notifyStateChanged();
			this.entriesChangeEvent.next();
		}
	}

	clear(): void {
		this.#entries = [];
	}

	internalExtractState(): unknown {
		return this.#entries;
	}

	internalApplyState(state: UndoEntry[]): void {
		this.#entries = state;
	}
}
