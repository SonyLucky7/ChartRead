import { getPersistentChartUrl, isChartUrlWithParams } from '../../../utils';
import { SaveChangesScopeType } from './save-changes-types';
import { TabSaveResponse, TvTab } from './tv-tab';

/**
 * Shared helpers for the unified tabs shutdown flow (app quit, window close, tab group switch).
 * They consolidate the unsaved-changes detection and chart saving logic that was previously
 * duplicated between TabbedWindowBase.willCloseWindow() and the WindowService/AppEventService quit path.
 */

export async function canFollowAutoSaveFlow(chartTabs: TvTab[]): Promise<boolean> {
	if (chartTabs.length === 0) {
		return false;
	}

	if (chartTabs.some((chartTab) => isChartUrlWithParams(chartTab.url))) {
		return false;
	}

	const probe = chartTabs.find((chartTab) => chartTab.isBrowserViewValid());

	return probe !== undefined && await probe.isAutoSaveEnabled();
}

export async function dispatchBeforeUnloadToChartTabs(chartTabs: TvTab[]): Promise<Map<TvTab, string | undefined>> {
	const messages = await Promise.all(chartTabs.map((chartTab) => chartTab.dispatchBeforeUnloadEvent()));

	return new Map(chartTabs.map((chartTab, index) => [chartTab, messages[index]]));
}

/**
 * Collects charts to be saved, deduplicated by persistent chart url.
 * Active charts have priority over background duplicates of the same layout.
 */
export function collectChartTabsPendingSave(chartTabs: Iterable<TvTab>): TvTab[] {
	const chartTabsPendingSave = new Map<string, TvTab>();
	// materialize once: the two passes below would lose elements on a one-shot iterable
	const chartTabList = [...chartTabs];

	// every window contributes its own active tab; each must win the dedup for its layout
	for (const chartTab of chartTabList) {
		const key = getPersistentChartUrl(chartTab.url);
		if (chartTab.active && !chartTabsPendingSave.has(key)) {
			chartTabsPendingSave.set(key, chartTab);
		}
	}

	for (const chartTab of chartTabList) {
		const key = getPersistentChartUrl(chartTab.url);
		if (!chartTabsPendingSave.has(key)) {
			chartTabsPendingSave.set(key, chartTab);
		}
	}

	return [...chartTabsPendingSave.values()];
}

export async function saveCharts(chartTabs: Iterable<TvTab>, scopeType: SaveChangesScopeType): Promise<TabSaveResponse[]> {
	const savePromises: Promise<TabSaveResponse | null>[] = [];

	for (const chartTab of chartTabs) {
		savePromises.push(chartTab.saveChart(scopeType));
	}

	return (await Promise.all(savePromises)).filter((value) => value !== null);
}
