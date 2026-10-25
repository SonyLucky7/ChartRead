import i18next from 'i18next';

export type TabTitlePart = string | TabTitleId;
export type TabTitleId = 'symbolLogo' | 'ticker' | 'priceChangeIcon' | 'lastPrice' | 'priceChange' | 'layoutName';

export const DEFAULT_TAB_SETTINGS: TabTitleState[] = [
	{
		id: 'symbolLogo',
		isVisible: true,
	},
	{
		id: 'ticker',
		isVisible: true,
	},
	{
		id: 'priceChangeIcon',
		isVisible: true,
	},
	{
		id: 'lastPrice',
		isVisible: true,
	},
	{
		id: 'priceChange',
		isVisible: true,
	},
	{
		id: 'layoutName',
		isVisible: true,
	},
];

/**
 * NOTE: the interface is used for both real tabs (with browser view) and draggable tabs in settings to manage tab title order.
 * The entities are completely independent, the only common thing is that they are draggable and are used in moveTab function.
 */
/**
 * TODO: separate TabDataPart and TabView interfaces, consider merging TabDataPart into a new full TabTitleState.
 */
export interface TabDataPart {
	id: TabTitlePart;
	// TODO: remove optional, make it number | null
	offset?: number;
}

export interface TabTitleState extends TabDataPart {
	isVisible: boolean;
}

function isTabTitleStateEqual(first: TabTitleState, second: TabTitleState): boolean {
	return first.id === second.id && first.isVisible === second.isVisible;
}

export function isDefaultTabTitleElementsOrder(titleElements: TabTitleState[]): boolean {
	return titleElements.every((value, index) => isTabTitleStateEqual(value, DEFAULT_TAB_SETTINGS[index]));
}

// eslint-disable-next-line @typescript-eslint/no-extra-parens
export const tabTitlePartWithTranslation = new Map<TabTitlePart, (() => string)>([
	['symbolLogo', () => i18next.t('Symbol logo')],
	['ticker', () => i18next.t('Ticker')],
	['priceChangeIcon', () => i18next.t('Price change icon')],
	['lastPrice', () => i18next.t('Last price')],
	['priceChange', () => i18next.t('Price change %')],
	['layoutName', () => i18next.t('Layout name')],
]);
