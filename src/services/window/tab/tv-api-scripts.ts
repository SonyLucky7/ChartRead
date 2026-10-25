import { Layout } from '../window-api';
import { SaveChangesScopeType } from './save-changes-types';
import { TabSaveResponse } from './tv-tab';

export function restoreLayout(layout: Layout): void {
	if (!window.TradingViewApi) {
		return;
	}

	const changeSymbol = (chartIndex: number, symbol: string): Promise<void> =>
		new Promise((resolve) => {
			return window.TradingViewApi.chart(chartIndex).setSymbol(symbol, resolve);
		});

	const changeInterval = (chartIndex: number, interval: string): Promise<boolean> => {
		return window.TradingViewApi.chart(chartIndex).setResolution(interval);
	};

	let symbolsApplied = false;

	const applyChartSymbols = async(): Promise<void> => {
		if (symbolsApplied) {
			return;
		}
		if (!window?.TVD) {
			return;
		}

		window.TVD?.log({
			message: '[restoreLayout()] will restore symbols',
			// Because the code runs as an injection in the browser, we need to use numbers
			level: 1, // LogLevel.info
		});

		let activeChart = 0;

		for (let i = 0; i < layout.charts.length; i++) {
			const chart = layout.charts[i];
			if (chart.active) {
				activeChart = i;
			}
			const resultChanges = await Promise.allSettled([changeSymbol(i, chart.symbol), changeInterval(i, chart.interval)]);

			window.TVD?.log({
				message: `resultSymbolChanges = ${ resultChanges[0].status }; resultIntervalChanges = ${ resultChanges[1].status };`,
				// Because the code runs as an injection in the browser, we need to use numbers
				level: resultChanges.some((result) => result.status === 'rejected')
					// eslint-disable-next-line @typescript-eslint/no-magic-numbers
					? 3 // LogLevel.Error
					: 0, // LogLevel.Debug
			});
		}

		window.TradingViewApi.setActiveChart(activeChart);

		symbolsApplied = true;
		window.TVD.layoutRestored();
	};

	// there is no API to unsubscribe the callback, so we make sure
	// that applyChartSymbols runs only once exploiting "symbolsApplied" flag
	window.TradingViewApi.subscribe('layout_changed', () => {
		applyChartSymbols().catch(err => console.log(err));
	});

	if (!layout.layoutType) {
		applyChartSymbols().catch(err => console.log(err));
		return;
	}

	window.TradingViewApi.setLayout(layout.layoutType);
}

export function getLayout(): string | undefined {
	if (!window.TradingViewApi) {
		return;
	}

	return window.TradingViewApi.layout();
}

export function checkShouldBeSaved(): boolean {
	// if there is no shouldBeSaved function, then the call is on a non-chart page and we can save changes
	if (!window.TradingViewApi?.shouldBeSaved) {
		return true;
	}
	return window.TradingViewApi.shouldBeSaved();
}

export function saveChartAndAwaitResult(scopeType: SaveChangesScopeType, resolveDelayMs: number): Promise<TabSaveResponse> {
	return new Promise((resolve) => {
		window.TradingViewApi.saveChartToServer(
			() => setTimeout(() => resolve({ scopeType, success: true }), resolveDelayMs),
			() => setTimeout(() => resolve({ scopeType, success: false }), resolveDelayMs),
		);
	});
}
