/* eslint-disable @typescript-eslint/naming-convention */
import { PlatformTheme } from '../services/settings/theme';
import { SymbolInterval } from './symbol';
import { TVD } from './tvd-desktop';

type GoProFeatures = 'manyDesktopWindows';

type WatchedValueCallback<T> = (value: T) => void;

interface WatchedValue<T> {
	value(): T;
	subscribe(cb: WatchedValueCallback<T>, options?: WatchedValueSubscribeOptions): void;
	unsubscribe(cb?: WatchedValueCallback<T> | null): void;
}

interface WatchedValueSubscribeOptions {
	/** Subscribe for only one update, and remove subscription afterwards. (the callback will be executed only once) */
	once?: boolean;
	/** if it is set to true then the callback will be executed with the previous value (if available) */
	callWithLast?: boolean;
}

export const EMPTY_CHART_LAYOUT = '';

export interface TvChart {
	/**
	 * NOTE: values are returned in seconds, but TradingViewApi.activeChart().syncDateRange() accepts values in milliseconds
	 */
	getVisibleRange(): { from: number; to: number; };

	symbol(): string;
	resolution(): string;

	// methods for syncing tab's //
	/**
	 * Change the chart's symbol.
	 *
	 * **Example**
	 * ```javascript
	 * widget.activeChart().setSymbol('IBM');
	 * ```
	 * Note: if you are attempting to change multiple charts (multi-chart layouts) at the same time with
	 * multiple `setSymbol` calls then you should set `doNotActivateChart` option to `true`.
	 *
	 * @param symbol A symbol.
	 * @param options Optional object of options for the new symbol or optional callback that is called when the data for the new symbol has loaded.
	 */
	setSymbol(symbol: string, callback?: () => void): void;

	/**
	 * Change the chart's interval (resolution).
	 *
	 * **Example**
	 * ```javascript
	 * widget.activeChart().setResolution('2M');
	 * ```
	 * Note: if you are attempting to change multiple charts (multi-chart layouts) at the same time with
	 * multiple `setResolution` calls then you should set `doNotActivateChart` option to `true`.
	 *
	 * @param resolution A resolution.
	 * @param options Optional object of options for the new resolution or optional callback that is called when the data for the new resolution has loaded.
	 * @returns A promise that resolves with a boolean value. It's `true` when the resolution has been set and `false` when setting the resolution is not possible.
	 */
	setResolution(resolution: string, callback?: () => void): Promise<boolean>;
	syncTime(time: number): void;
	// NOTE: values are accepted in milliseconds
	syncDateRange(start: number, end: number): void;
}

declare global {
	interface Window {
		TVD: TVD;

		TradingViewApi: {
			getSaveChartService(): {
				autoSaveEnabled(): {
					value(): boolean;
				};
			};
			activeChartIndex(): number;
			saveChartToServer(onComplete?: () => void, onFail?: () => void): void;
			shouldBeSaved(): boolean;
			themes(): {
				getCurrentThemeName(): string;
				isStdTheme(): Promise<boolean>;
				setStdThemeForLayout(themeName: PlatformTheme, sync?: boolean): void;
				setStdTheme(themeName: PlatformTheme, sync?: boolean): Promise<void>;
			};
			symbolSync(): WatchedValue<boolean>;
			intervalSync(): WatchedValue<boolean>;
			chartsCount(): number;
			chart(id: number): TvChart;
			charts(): Generator<TvChart>;
			activeChart(): TvChart;
			setActiveChart(id: number): void;
			changeSymbol(symbol: string, interval: string): void;
			getSymbolInterval(): SymbolInterval;
			setLayout(layout: string): void;
			layout(): string;
			subscribe(ev: 'layout_changed', cb: () => void): void;
			subscribe(ev: 'sync_time', cb: (time: number) => void): void;
			subscribe(ev: 'sync_date_range', cb: (startTime: number, endTime: number) => void): void;
			startFullscreen(): void;
			timeSync(): WatchedValue<boolean>;
			linking: {
				symbol: WatchedValue<string>;
				proSymbol: WatchedValue<string>;
				interval: WatchedValue<string>;
			};
		};

		TradingView: {
			createGoProDialog(params: { feature: GoProFeatures; }): void;
			isFeatureEnabled(key: string): boolean;
		};
		_setTheme(theme: string): void;
		tvdCredentialHelperStarted: boolean;
	}
}

export default undefined;
