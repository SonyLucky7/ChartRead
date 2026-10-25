export interface UndoEntry {
	command: string;
	data: unknown;
}

// Temp undo shapes start
// Do not import real Types for tab/window states/undo states, to avoid circular deps
// TODO: Get undo types inline and single source of truth without circular dpes
interface TabClosedUndoDataShape {
	persistentId: string;
}
interface TabbedWindowClosedUndoDataShape {
	tabs: Array<TabClosedUndoDataShape>;
}

function isTabCloseUndoData(undoData: unknown): undoData is TabClosedUndoDataShape {
	if (undoData == null) {
		// intentional undefined + null check
		return false;
	}

	if (typeof undoData === 'object' &&
		'persistentId' in undoData &&
		typeof undoData.persistentId === 'string') {
		return true;
	}

	return false;
}

function isTabbedWindowCloseUndoData(undoData: unknown): undoData is TabbedWindowClosedUndoDataShape {
	if (undoData == null || typeof undoData !== 'object') {
		// intentional undefined + null check
		return false;
	}

	if (!('tabs' in undoData)) {
		return false;
	}
	const tabs = undoData.tabs;
	if (!Array.isArray(tabs)) {
		return false;
	}

	// for our purpose it should be enough to check 1st element
	return isTabCloseUndoData(tabs[0]);
}
// Temp undo shapes end

// TODO(Artem): ADD TESTS for this in undostate testing

export function getSetOfTabIdsFromUndoEntry(entry: UndoEntry): Set<string> {
	const tabIds = new Set<string>();
	const entryData = entry.data;
	if (entry.command === 'tab-closed') {
		if (!isTabCloseUndoData(entryData)) {
			return tabIds;
		}
		tabIds.add(entryData.persistentId);
	}
	if (entry.command === 'window-closed') {
		if (!isTabbedWindowCloseUndoData(entryData)) {
			return tabIds;
		}
		for (const tab of entryData.tabs) {
			tabIds.add(tab.persistentId);
		}
	}

	return tabIds;
}

export function getSetOfTabIdsFromUndoEntries(entries: ReadonlyArray<UndoEntry>): Set<string> {
	const tabIds = new Set<string>();

	for (const entry of entries) {
		if (entry.command === 'tab-closed') {
			if (isTabCloseUndoData(entry.data)) {
				tabIds.add(entry.data.persistentId);
			}
		}
		if (entry.command === 'window-closed') {
			if (!isTabbedWindowCloseUndoData(entry.data)) {
				continue;
			}
			for (const tab of entry.data.tabs) {
				tabIds.add(tab.persistentId);
			}
		}
	}

	return tabIds;
}
