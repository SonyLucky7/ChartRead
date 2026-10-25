import { TabDataPart } from '../../services/settings/tab-title-interfaces';

interface MovedTabsState {
	tabState: TabDataPart[];
	holeIndex: number;
}

export function moveTab(tabId: string, tabOffset: number, hoveredTabIndex: number, tabState: TabDataPart[]): MovedTabsState | undefined {
	if (hoveredTabIndex < 0) {
		return;
	}

	// recalculating tabs indexes using their offset
	const virtualTabs = getVirtualTabs(tabState, tabId);

	// finding index of a hole tab
	// other tabs may be moved to a hole
	let holeIndex = virtualTabs.findIndex((t) => !t);

	if (holeIndex < 0) {
		// virtual tabs may have smaller length when hole is on the last element on panel
		if (virtualTabs.length < tabState.length) {
			holeIndex = tabState.length - 1;
		}
		// virtual tabs are the same as regular tabs when the drag just started
		// in that case hole is a currently dragged tab
		else {
			const draggedTabIndex = virtualTabs.findIndex(t => t.id === tabId);
			holeIndex = draggedTabIndex;
		}
	}

	// tabs from startIndex to endIndex should be offsetted by offset
	let startIndex: number;
	let endIndex: number;
	let offset: number;

	// hole is on the right ana all tabs from currently hovered should be moved to the hole
	if (hoveredTabIndex < holeIndex) {
		startIndex = hoveredTabIndex;
		endIndex = holeIndex;
		offset = tabOffset;
	}

	// hole is on the left
	else if (hoveredTabIndex > holeIndex) {
		startIndex = holeIndex + 1;
		endIndex = hoveredTabIndex + 1;
		offset = -tabOffset;
	}

	// if the hole is under a dragged element - do nothing
	else {
		return { tabState, holeIndex };
	}

	// shifting tabs
	for (let i = startIndex; i < endIndex; i++) {
		const tab = tabState.find(t => t === virtualTabs[i]);

		if (!tab) {
			continue;
		}

		if (!tab.offset) {
			tab.offset = 0;
		}

		tab.offset += offset;
	}

	return { tabState, holeIndex };
}

function getVirtualTabs(tabs: TabDataPart[], tabId: string): TabDataPart[] {
	if (!tabs) {
		return [];
	}

	const virtualTabs: TabDataPart[] = [];

	tabs.forEach((tab, index) => {
		let virtualIndex = index;

		if (!!tab.offset && tab.offset !== 0 && tab.id !== tabId) {
			virtualIndex = tab.offset > 0 ? virtualIndex + 1 : virtualIndex - 1;
		}
		else if (virtualTabs[virtualIndex]) {
			// tab already added which means we're processing currently dragged tab
			// current drag target should be resolved as undefined as it creates a hole between virtual tabs
			return;
		}

		virtualTabs[virtualIndex] = tab;
	});

	return virtualTabs;
}

export function resetTabsOffset(tabState: TabDataPart[] | null): TabDataPart[] | undefined {
	if (!tabState) {
		return;
	}

	for (const tab of tabState) {
		tab.offset = undefined;
	}

	return tabState;
}
