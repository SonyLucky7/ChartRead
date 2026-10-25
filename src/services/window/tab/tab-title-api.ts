import { t, TFunction } from 'i18next';

import { TabFaviconsKey } from '../../../app/window/tab-panel/tab-utils';
import { loggerService } from '../../../logger';
import {
	isAnyScreener,
	isCommunityIdeaUrl,
	isCommunityIndicatorsUrl,
	isCountriesUrl,
	isFollowTVUrl,
	isIdeaUrl,
	isMainPageUrl,
	isMarketNewsUrl,
	isNewsExactUrl,
	isNewsSectionUrl,
	isNewsTopStories,
	isNewsUrl,
	isStatusUrl,
	isWorldEconomyUrl,
} from '../../../utils/tv-uri';
import { isLocalURI } from '../../../utils/uri';
import { DEFAULT_TAB_URL } from '../../interfaces';

export const urlPathnames = {
	bonds: 'bond-screener',
	cexScreener: 'cex-screener',
	community: 'community',
	communityIndicators: 'scripts',
	communityTradingIdeas: 'ideas',
	cryptoCoins: 'crypto-coins-screener',
	cryptoHeatmap: 'heatmap/crypto',
	cryptoPairsScreener: 'crypto-screener',
	dexScreener: 'dex-screener',
	dividendCalendar: 'dividend-calendar',
	earningsCalendar: 'earnings-calendar',
	economicCalendar: 'economic-calendar',
	etfScreener: 'etf-screener',
	etfHeatmap: 'heatmap/etf',
	errorView: 'error-view',
	forexScreener: 'forex-screener',
	fundamentalGraphs: 'fundamental-graphs',
	helpCenter: 'support',
	ipoCalendar: 'ipo-calendar',
	licenses: 'licenses',
	macroMaps: 'macro-maps',
	markets: 'markets',
	newTab: 'new-tab',
	news: 'news',
	newsFlow: 'news-flow',
	options: 'options',
	optionsChain: 'options/chain',
	optionsStrategies: 'options/strategies',
	optionsStrategyFinder: 'options/strategy-finder',
	optionsVolatility: 'options/volatility',
	optionsVolume: 'options/volume',
	pineScreener: 'pine-screener',
	portfolios: 'portfolios',
	revenueCalendar: 'revenue-calendar',
	stockHeatmap: 'heatmap/stock',
	stockScreener: 'screener',
	yieldCurves: 'yield-curves',
};

type TFunctionReturn = () => ReturnType<TFunction>;

const customTabTitles = new Map<string, TFunctionReturn>([
	[urlPathnames.community, () => t('Community')],
	[urlPathnames.communityIndicators, () => t('Indicators and strategies')],
	[urlPathnames.communityTradingIdeas, () => t('Community ideas')],
	[urlPathnames.cryptoHeatmap, () => t('Crypto Heatmap')],
	[urlPathnames.economicCalendar, () => t('Economic Calendar')],
	[urlPathnames.revenueCalendar, () => t('Revenue Calendar')],
	[urlPathnames.earningsCalendar, () => t('Earnings Calendar')],
	[urlPathnames.dividendCalendar, () => t('Dividend Calendar')],
	[urlPathnames.ipoCalendar, () => t('IPO Calendar')],
	[urlPathnames.etfHeatmap, () => t('ETF Heatmap')],
	[urlPathnames.errorView, () => t('Oops, something went wrong')],
	[urlPathnames.fundamentalGraphs, () => t('Fundamental Graphs')],
	[urlPathnames.licenses, () => t('Libraries we use')],
	[urlPathnames.macroMaps, () => t('Macro Maps')],
	[urlPathnames.markets, () => t('Markets')],
	[urlPathnames.newTab, () => t('New Tab')],
	[urlPathnames.news, () => t('News')],
	[urlPathnames.newsFlow, () => t('News Flow')],
	[urlPathnames.options, () => t('Options Chain')],
	[urlPathnames.optionsChain, () => t('Options Chain')],
	[urlPathnames.optionsStrategies, () => t('Options Strategy Builder')],
	[urlPathnames.optionsStrategyFinder, () => t('Options Strategy Finder')],
	[urlPathnames.optionsVolatility, () => t('Options Volatility')],
	[urlPathnames.optionsVolume, () => t('Options Volume')],
	[urlPathnames.pineScreener, () => t('Pine Screener')],
	[urlPathnames.portfolios, () => t('Portfolios')],
	[urlPathnames.stockHeatmap, () => t('Stock Heatmap')],
	[urlPathnames.yieldCurves, () => t('Yield Curves')],
]);

export function acceptTabTitleChangeWhenDidNavigateInPage(targetUrl: string): boolean {
	const acceptedUrls = [
		urlPathnames.optionsChain,
		urlPathnames.optionsStrategies,
		urlPathnames.optionsStrategyFinder,
		urlPathnames.optionsVolatility,
		urlPathnames.optionsVolume,
		urlPathnames.earningsCalendar,
		urlPathnames.dividendCalendar,
		urlPathnames.ipoCalendar,
		urlPathnames.revenueCalendar,
		urlPathnames.economicCalendar,
	];

	return acceptedUrls.some((acceptedUrl) => targetUrl.includes(acceptedUrl));
}

export function getCustomTabTitleFromUrl(url?: string): string | undefined {
	if (!url || url === DEFAULT_TAB_URL) {
		return;
	}

	if (isNewsUrl(url)) {
		if (isNewsExactUrl(url) || isNewsSectionUrl(url)) {
			return customTabTitles.get(urlPathnames.news)?.();
		}

		return;
	}

	if (isCommunityIdeaUrl(url)) {
		return customTabTitles.get(urlPathnames.communityTradingIdeas)?.();
	}

	if (isCommunityIndicatorsUrl(url)) {
		return customTabTitles.get(urlPathnames.communityIndicators)?.();
	}

	const pagePathname = new URL(url).pathname;
	const [, mainPlatformSection, auxPlatformSection] = pagePathname.split('/');
	const pathName = auxPlatformSection ? `${ mainPlatformSection }/${ auxPlatformSection }` : mainPlatformSection;

	return customTabTitles.get(pathName)?.();
}

export function getTabFaviconKeyFromUrl(url?: string): string | undefined {
	if (!url || url === DEFAULT_TAB_URL) {
		return;
	}

	switch (true) {
		case url.includes('ideas') || isIdeaUrl(url): {
			return TabFaviconsKey.Ideas;
		}
		case isFollowTVUrl(url): {
			return TabFaviconsKey.Follow;
		}
		case isMarketNewsUrl(url): {
			return TabFaviconsKey.News;
		}
		case isCountriesUrl(url): {
			return TabFaviconsKey.Countries;
		}
		case isWorldEconomyUrl(url) || isNewsTopStories(url): {
			return TabFaviconsKey.WorldEconomy;
		}
		case isStatusUrl(url): {
			return TabFaviconsKey.Status;
		}
		case isMainPageUrl(url): {
			return TabFaviconsKey.Home;
		}
		case isAnyScreener(url): {
			return TabFaviconsKey.Screener;
		}
		case isLocalURI(url): {
			if (url.includes('error-view')) {
				return TabFaviconsKey.ErrorView;
			}
			if (url.includes('licenses')) {
				return TabFaviconsKey.Licenses;
			}

			return;
		}
		default: {
			break;
		}
	}

	let faviconKey: string | undefined;

	try {
		faviconKey = new URL(url).pathname.split('/').at(1);
	}
	catch (error) {
		loggerService().error(`getFaviconSourceFromUrl(url: ${ url }) error`, error);
		return;
	}

	if (!faviconKey) {
		return;
	}

	return faviconKey.toLowerCase();
}
