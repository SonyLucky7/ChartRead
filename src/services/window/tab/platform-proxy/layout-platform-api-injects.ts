import type { Chart } from '../../../../tv-api/symbol';
import type { TvChart } from '../../../../tv-api/window';

type ChartParamsDiff = {
	symbol?: string;
	interval?: string;
};

export function subscribeOnLayoutEvents(): void {
	if (!window.TradingViewApi) {
		return;
	}

	function subOnLayoutChange(cb: () => void): void {
		if (!('subscribe' in window.TradingViewApi)) {
			return;
		}

		window.TradingViewApi.subscribe('layout_changed', () => {
			cb();
		});
	}

	function subOnSymbolOrIntervalChange(key: 'proSymbol' | 'interval', cb: (updatedChartParameters: ChartParamsDiff) => void): void {
		if (!window.TradingViewApi.linking[key]) {
			return;
		}

		// we need to rely on the callback value instead of ChartWidget API
		// there is no any guarantee that ChartWidget API will provide us with non outdated value
		window.TradingViewApi.linking[key].subscribe((value) => {
			cb({ [key === 'proSymbol' ? 'symbol' : key]: value });
		});
	}

	let previousLayout = '';
	const generateLayoutAndSendToTabIpc = (updatedChartParameters?: ChartParamsDiff): void => {
		if (!window.TradingViewApi || !window.TradingViewApi.layout) {
			return;
		}

		const layout = window.TradingViewApi.layout();
		previousLayout = layout;

		const activeChartIndex = window.TradingViewApi.activeChartIndex();
		const chartsCount = window.TradingViewApi.chartsCount();

		const isSymbolSync = window.TradingViewApi.symbolSync().value();
		const isIntervalSync = window.TradingViewApi.intervalSync().value();

		const charts: Chart[] = [];

		for (let chartIndex = 0; chartIndex < chartsCount; chartIndex++) {
			let chart: TvChart | undefined;

			try {
				chart = window.TradingViewApi.chart(chartIndex);
			}
			catch (err) {
				console.log(err);
			}

			if (!chart) {
				console.log(`No chart at index ${ chartIndex }`);
				continue;
			}

			const isActive = activeChartIndex === chartIndex;

			let chartData = {
				active: isActive,
				interval: chart.resolution(),
				symbol: chart.symbol(),
			};

			// there is no any guarantee that ChartWidget API will provide us with non outdated value
			// so, we need to set a new value manually if there is one
			if (isActive) {
				chartData = {
					...chartData,
					symbol: window.TradingViewApi.linking.proSymbol.value(),
					...updatedChartParameters,
				};
			}

			// sync all widget charts if respective sync is turned on
			if (isSymbolSync && updatedChartParameters?.symbol) {
				chartData.symbol = updatedChartParameters.symbol;
			}
			if (isIntervalSync && updatedChartParameters?.interval) {
				chartData.interval = updatedChartParameters.interval;
			}

			charts.push(chartData);
		}

		window.TVD.layoutChange({
			layoutType: layout,
			charts,
		});
	};

	const handleLayoutChange = (): void => {
		const currentLayout = window.TradingViewApi.layout();

		if (previousLayout === currentLayout) {
			return;
		}

		generateLayoutAndSendToTabIpc();
	};

	// subscribe on platform' events
	subOnLayoutChange(handleLayoutChange);
	subOnSymbolOrIntervalChange('proSymbol', generateLayoutAndSendToTabIpc);
	subOnSymbolOrIntervalChange('interval', generateLayoutAndSendToTabIpc);
}
