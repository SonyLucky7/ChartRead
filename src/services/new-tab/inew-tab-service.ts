import { Observable } from 'rxjs';
import { Tagged } from 'type-fest';

import { HttpRequestBody } from '../../http';
import { Disposable } from '../../tvd-runtime/core';

export const NEW_TAB_SERVICE_CONTRACT = 'tvd:new-tab-service';

export type ResolutionString = Tagged<string, 'ResolutionString'>;

export interface SortData {
	sortDirection: SortDirection;
	sortField: SortField;
}

export const enum SortField {
	Modified = 'modified',
	Title = 'title',
	Expiration = 'expiration',
}

export const enum SortDirection {
	Asc,
	Desc,
}

export interface CreateLayoutHelperOptions {
	body: HttpRequestBody;
	url: string;
	tabId?: string;
}

export interface CopyLayoutOptions {
	isFavorite: boolean;
	layoutId: string;
	layoutName: string;
	tabId?: string;
}
export interface Layouts {
	layouts: ChartItem[];
}

export type LayoutResponse = 'success' | string;

export type ResponseData = {
	code: string;
	detail: string;
};

/* eslint-disable camelcase, @typescript-eslint/naming-convention */
export type ResponseItem = {
	created: string;
	created_time: string;
	created_timestamp: number;
	expression: string;
	id: number;
	image_url: string;
	interval: ResolutionString;
	modified: string;
	modified_iso: number;
	name: string;
	pro_symbol: string;
	resolution: string;
	short_name: string;
	short_symbol: string;
	symbol: string;
	url: string;
	favorite?: true;
};
/* eslint-enable camelcase, @typescript-eslint/naming-convention */

export interface ChartItem {
	id: number;
	url: string;
	title: string;
	symbol: string;
	logoUrls: string[];
	interval: ResolutionString;
	modified: number;
	favorite?: boolean;
}

export interface ChartItemExtended extends ChartItem {
	description: string;
}

export type PageMetadata = {
	url: string;
	isTitleShouldUpdate?: boolean;
	isCtrlKeyPressed?: boolean;
	name?: string;
	tabId?: string;
	title?: string;
};

export interface LayoutDrawingsCount {
	drawings: number;
	symbols: number;
}

export interface INewTabService extends Disposable {
	showSignInDialog(): void;
	saveSortDirection(sortData: SortData): void;
	getSortDirection(): SortData;
	getShowProductDrawerHint(): boolean;
	setShowProductDrawerHint(showHint: boolean): void;
	getShowTvMcpServerHint(): boolean;
	setShowTvMcpServerHint(showHint: boolean): void;
	setProductStates(productStates: ProductStates): void;
	getProductStates(): ProductStates;
	getFullLayoutUrl(chartUrl: string): string;
	loadURL(metadata: PageMetadata, inNewTab?: boolean): void;
	createLayout(layoutName: string, tabId?: string): Promise<LayoutResponse>;
	copyLayout(options: CopyLayoutOptions): Promise<string>;
	deleteLayout(chartUrl: string): Promise<void>;
	getLayoutDrawingsCount(layoutId: string, userId: string): Promise<LayoutDrawingsCount>;
	getLayouts(): Promise<Layouts>;
	updateFavoriteLayout(idChart: string, isFavorite: boolean): Promise<boolean>;
	layoutsEvent: Observable<void>;
}

export interface JwtTokenResponse {
	token: string;
}

export const isJwtTokenResponse = (value: any): value is JwtTokenResponse => typeof value === 'object' && 'token' in value;

export interface SymbolSize {
	countSources: number;
	currencyList: string[];
	ids: string[];
	sizeBytes: number;
	countDrawingGroups?: number;
}

interface ChartSize {
	countSourcesChart: number;
	sizeBytesChart: number;
	symbols: Record<string, SymbolSize>;
	countDrawingGroupsChart?: number;
}

interface ChartSizes {
	[chart: number | 'UserSync' | '_shared' | string]: ChartSize;
}

export interface LayoutDrawingsCountResponse {
	payload: {
		charts: ChartSizes;
		countSourcesTotal: number;
		limitBytesTotal: number;
		sizeBytesTotal: number;
	};
	success: true;
}

export const isLayoutDrawingsCountResponse = (value: any): value is LayoutDrawingsCountResponse => typeof value === 'object' && 'payload' in value;

export const productSectionItemIds = {
	screener: 'screener',
	screenerStocks: 'screener-stocks',
	screenerEtf: 'screener-etf',
	screenerBonds: 'screener-bonds',
	screenerCrypto: 'screener-crypto',
	screenerCexPairs: 'screener-cex-pairs',
	screenerDexPairs: 'screener-dex-pairs',
	screenerPine: 'screener-pine',
	heatmap: 'heatmap',
	heatmapStocks: 'heatmap-stocks',
	heatmapEtf: 'heatmap-etf',
	heatmapCrypto: 'heatmap-crypto',
	calendars: 'calendars',
	newsFlow: 'news-flow',
	portfolios: 'portfolios',
	yieldCurves: 'yield-curves',
	options: 'options',
	fundamentalGraphs: 'fundamental-graphs',
	markets: 'markets',
	community: 'community',
	communityIndicators: 'community-indicators',
	communityTradingIdeas: 'community-trading-ideas',
	macroMaps: 'macro-maps',
} as const;

const productSectionIds = [
	productSectionItemIds.screener,
	productSectionItemIds.heatmap,
	productSectionItemIds.community,
];

export type SectionId = typeof productSectionIds[number];

// TODO: use another approach: an object with all the entities and all the information about them
export const productIds = [
	productSectionItemIds.screenerStocks,
	productSectionItemIds.screenerEtf,
	productSectionItemIds.screenerBonds,
	productSectionItemIds.screenerCrypto,
	productSectionItemIds.screenerCexPairs,
	productSectionItemIds.screenerDexPairs,
	productSectionItemIds.screenerPine,
	productSectionItemIds.heatmapStocks,
	productSectionItemIds.heatmapEtf,
	productSectionItemIds.heatmapCrypto,
	productSectionItemIds.calendars,
	productSectionItemIds.newsFlow,
	productSectionItemIds.portfolios,
	productSectionItemIds.yieldCurves,
	productSectionItemIds.options,
	productSectionItemIds.fundamentalGraphs,
	productSectionItemIds.markets,
	productSectionItemIds.communityIndicators,
	productSectionItemIds.communityTradingIdeas,
	productSectionItemIds.macroMaps,
];

export type ProductId = typeof productIds[number];

export interface ProductState {
	isSelected: boolean;
}

export type ProductStates = Partial<Record<ProductId, ProductState>>;

export const isProductState = (value: unknown): value is ProductState =>
	typeof value === 'object' &&
	value !== null &&
	'isSelected' in value &&
	typeof value.isSelected === 'boolean';
