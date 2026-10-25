import { LinkValues, LinkValuesTuple } from '../../../../linking';

export function subscribeToChartLinkValuesUpdates(): void {
	if (window.TradingViewApi === undefined || window.TradingViewApi.linking === undefined) {
		return;
	}

	const intervalObserver = function(interval: string): void {
		window.TVD.linkingApi.updateLinkValues({ interval });
	};
	const symbolObserver = function(symbol: string): void {
		window.TVD.linkingApi.updateLinkValues({ symbol });
	};
	const timeObserver = function(time: number): void {
		window.TVD.linkingApi.updateLinkValues({ time });
	};
	const dateRangeObserver = function(startTime: number, endTime: number): void {
		window.TVD.linkingApi.updateLinkValues({ dateRange: { startTime, endTime } });
	};

	window.TradingViewApi.linking.interval.subscribe(intervalObserver);
	window.TradingViewApi.linking.proSymbol.subscribe(symbolObserver);
	window.TradingViewApi.subscribe('sync_time', timeObserver);
	window.TradingViewApi.subscribe('sync_date_range', dateRangeObserver);
}

export function subscribeToScreenerLinkValuesUpdates(): void {
	if (window.TradingViewApi === undefined || window.TradingViewApi.linking === undefined) {
		return;
	}

	const symbolObserver = function(symbol: string): void {
		window.TVD.linkingApi.updateLinkValues({ symbol });
	};

	window.TradingViewApi.linking.proSymbol.subscribe(symbolObserver);
}

export function requestLinkValuesUpdate(): void {
	if (window.TradingViewApi === undefined || window.TradingViewApi.linking === undefined) {
		return;
	}

	const { from, to } = window.TradingViewApi.activeChart().getVisibleRange();
	const quantifierToMilliseconds = 1_000;

	const linkValues: LinkValuesTuple = {
		symbol: window.TradingViewApi.linking.proSymbol.value(),
		interval: window.TradingViewApi.linking.interval.value(),
		dateRange: {
			startTime: from * quantifierToMilliseconds,
			endTime: to * quantifierToMilliseconds,
		},
	};

	window.TVD.linkingApi.updateLinkValues(linkValues);
}

export function changeSymbolForActiveChart(symbol: string): void {
	if (!window.TradingViewApi?.activeChart) {
		return;
	}

	window.TradingViewApi.activeChart().setSymbol(symbol);
}

export function changeIntervalForActiveChart(interval: string): void {
	if (!window.TradingViewApi?.activeChart) {
		return;
	}

	window.TradingViewApi.activeChart().setResolution(interval)
		.catch((error: unknown) => {
			window.TVD.log({
				message: `changeIntervalHelper(interval: ${ interval }): failed to change interval for active chart`,
				// Because the code runs as an injection in the browser, we need to use numbers
				level: 2, // LogLevel.Warn
				error,
			});
		});
}

export function changeTimeForActiveChart(time: number): void {
	if (!window.TradingViewApi?.activeChart) {
		return;
	}

	// if layout time sync is enabled, the time will be synced for all charts, otherwise - only for active chart
	if (window.TradingViewApi.timeSync().value()) {
		for (const chart of window.TradingViewApi.charts()) {
			chart.syncTime(time);
		}
	}
	else {
		window.TradingViewApi.activeChart().syncTime(time);
	}
}

export function changeDateRangeForActiveChart(startTime: number, endTime: number): void {
	if (!window.TradingViewApi?.activeChart) {
		return;
	}

	window.TradingViewApi.activeChart().syncDateRange(startTime, endTime);
}

export const LINK_VALUES_SETTERS: Record<keyof LinkValues, string> = {
	symbol: changeSymbolForActiveChart.toString(),
	interval: changeIntervalForActiveChart.toString(),
	time: changeTimeForActiveChart.toString(),
	dateRange: changeDateRangeForActiveChart.toString(),
};
