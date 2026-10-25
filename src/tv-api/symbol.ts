import { Layout } from '../services/window/window-api';

export interface SymbolInterval {
	symbol: string;
	interval: string;
}

export interface Chart {
	active: boolean;
	symbol: string;
	interval: string;
}

export function areEqualLayouts(first: Layout, second: Layout): boolean {
	if (first.layoutType !== second.layoutType || first.charts.length !== second.charts.length) {
		return false;
	}

	for (let i = 0; i < first.charts.length; i++) {
		const firstChart = first.charts[i];
		const secondChart = second.charts[i];

		if (firstChart.active !== secondChart.active ||
			firstChart.interval !== secondChart.interval ||
			firstChart.symbol !== secondChart.symbol) {
			return false;
		}
	}

	return true;
}
