import { format } from 'url';

import { lazy } from './lazy';

export const TARGET_TVD_HOST = 'TARGET_TVD_HOST';
export const DEFAULT_TVD_HOST = 'https://www.tradingview.com/';

/*
 * Making RegExp to determine that URL is belongs to TV host.
 * host url originally taken from config.
 * It can be:
 * - default form:  https://www.[domain].tradingview.com/ (where domain any symbols), for example https://www.betaX.tradingview.com/
 * - free form: http://localhost:6285/  (local dev server)
 *
 * In case of default form more advanced re should be used: https:\\/\\/((\\w|-)*\\.)?tradingview\\.com,
 * but for 'free' from just prepare default host string to be usable with re.
*/
const tvHostReString = lazy<string>(() => {
	const tvHostDefaultRe = 'http(s?):\\/\\/((\\w|-)*\\.)?tradingview\\.com';
	let targetTvHost = DEFAULT_TVD_HOST;

	if (TARGET_TVD_HOST in process.env) {
		targetTvHost = process.env[TARGET_TVD_HOST] ?? DEFAULT_TVD_HOST;
	}

	if (new RegExp(tvHostDefaultRe, 'i').exec(targetTvHost) !== null) {
		return tvHostDefaultRe;
	}

	if (targetTvHost.endsWith('/')) {
		targetTvHost = targetTvHost?.substring(0, targetTvHost.length - 1);
	}

	return targetTvHost
		.replace(/\./gi, '\\.')
		.replace(/\//gi, '\\/');
});

/**
 * Build RE for TV's url match.
 * Allowed special entries:
 *  - *: match any sequence
 *  - ${TV}: match TV host
 */
export function makeUrlRegExp(url: string | string[], exactMatch = true): RegExp | RegExp[] {
	const convertStringToRegExp = (str: string): RegExp => {
		// tradingview match general rule: ^https:\/\/((\w|-)*\.)?tradingview\.com\/(.*)$
		// for example: https://staging-frontend-beta.tradingview.com/u/profile

		let reStr = str
			.toString()
			.replace(/\./gi, '\\.')
			.replace(/(?<!\))\*/gi, '(.*)');

		if (reStr.match(/\w+(\/\((\.\*\)))/gi)) {
			reStr = reStr.replace(/\/\((\.\*\))/gi, '(/(.*))?');
		}

		reStr = reStr
			.replace(/\//gi, '\\/')
			.replace(/\$\{TV\}/gi, tvHostReString());

		reStr = `^${ reStr }${ exactMatch ? '$' : '' }`;

		return new RegExp(reStr, 'i');
	};

	if (typeof url === 'string') {
		return convertStringToRegExp(url);
	}

	return url.map(convertStringToRegExp);
}

// eslint-disable-next-line no-useless-escape
const tvChart = '${TV}/chart/([a-zA-Z0-9]{0,12})?\/?';
const tvChartWithParams = '(${TV}/chart/([a-zA-Z0-9]{0,12})?)/\\?*?';
const tvScreeners = '${TV}/(\\w|-)*screener/*';
const tvCalendars = '${TV}/(\\w|-)*calendar/*';
const tvIdeas = '${TV}/chart/[a-z0-9-._~:\\?#@!$&\'()*+,;%=]+/[a-z0-9-._~:\\?#@!$&\'()*+,;%=]+/';

const isAnyScreener__ = lazy(() => makeUrlRegExp(tvScreeners));
const isMainRe__ = lazy(() => makeUrlRegExp('${TV}/', true));
const chartDefault__ = lazy(() => makeUrlRegExp('${TV}/chart/', true));
const chartRe__ = lazy(() => makeUrlRegExp(tvChart));
const chartWithParamsRe__ = lazy(() => makeUrlRegExp(tvChartWithParams));
const ideaRe__ = lazy(() =>
	makeUrlRegExp(
		tvIdeas,
		true,
	)
);
const screenerRe__ = lazy(() => makeUrlRegExp('${TV}/screener/*'));
const heatmapRe__ = lazy(() => makeUrlRegExp('${TV}/heatmap/*'));
const communityRe__ = lazy(() => makeUrlRegExp('${TV}/community/*'));
const pineScriptManualRe__ = lazy(() => makeUrlRegExp('${TV}/pine-script-docs/en/v5/Introduction.html'));
const pineScriptReferenceRe__ = lazy(() => makeUrlRegExp('${TV}/pine-script-reference/v5/'));
const isScreenshotRe__ = lazy(() => makeUrlRegExp('${TV}/x/*'));
const isTVRe__ = lazy(() => makeUrlRegExp('${TV}/*'));
const accountRecoveryRe__ = lazy(() => makeUrlRegExp('${TV}/account-recovery/*'));
const detachedChatRe__ = lazy(() => makeUrlRegExp('${TV}/chat/*'));
const isSnapshotRe__ = lazy(() => { return /:\/\/s3\..+\/snapshots\//i; });
const pineEditor__ = lazy(() => makeUrlRegExp('${TV}/pine/*'));
const marketRe__ = lazy(() => makeUrlRegExp('${TV}/markets/*'));
const marketNewsRe__ = lazy(() => makeUrlRegExp('${TV}/markets/*/news/'));
const countriesRe__ = lazy(() => makeUrlRegExp('${TV}/markets/stocks-*/*'));
const worldEconomyRe__ = lazy(() => makeUrlRegExp('${TV}/markets/world-economy/*'));
const followTVRe__ = lazy(() => makeUrlRegExp('${TV}/u/TradingView/'));
const newsRe__ = lazy(() => makeUrlRegExp('${TV}/news/*'));
const newsExactRe__ = lazy(() => makeUrlRegExp('${TV}/news/'));
const newsSectionsRe__ = lazy(() => makeUrlRegExp('${TV}/news/\\?market=*'));
const newsTopStoriesRe__ = lazy(() => makeUrlRegExp('${TV}/news/\\?market=topstories'));
const forBusinessChartingRe__ = lazy(() => makeUrlRegExp('${TV}/HTML5-stock-forex-bitcoin-charting-library/'));
const supportRe__ = lazy(() => makeUrlRegExp('${TV}/support/*'));
const statusRe__ = lazy(() => makeUrlRegExp('https://status.tradingview.com/', true));
const isCommunityIdeaRe__ = lazy(() => makeUrlRegExp('${TV}/ideas/*'));
const isCommunityIndicatorsRe__ = lazy(() => makeUrlRegExp('${TV}/scripts/*'));

const isHeaderVisibleUrlsRe__ = lazy(() => makeUrlRegExp([
	'${TV}/',
	'${TV}/ideas/*',
	tvIdeas,
	'${TV}/scripts/*',
	'${TV}/script/*',
	'${TV}/community/*',
	'${TV}/widget/',
	'${TV}/markets/corporate-bonds/*',
	'${TV}/social-network/',
	'${TV}/the-leap/*',
	'${TV}/broker/*',
	'${TV}/data-coverage/',
	'${TV}/markets/stocks-*/*',
]));

const marketBondsRe__ = lazy(() => makeUrlRegExp('${TV}/markets/bonds/*'));

const linkableUrlsRe__ = lazy(() => makeUrlRegExp([
	tvChart,
	tvScreeners,
	'${TV}/markets/*',
	'${TV}/symbols/*',
	tvCalendars,
]));

const tradingviewLinkRe = /^tradingview:\/\/(\S+)$/;

export function urlMatch(url: string, regExp: RegExp | RegExp[]): boolean {
	const cleanUrl = url.split('\n').join('');
	if (regExp instanceof RegExp) {
		return regExp.test(cleanUrl);
	}
	return regExp.some(re => re.test(cleanUrl));
}

export function isMainPageUrl(url: string): boolean {
	return urlMatch(url, isMainRe__());
}

export function isPineEditorUrl(url: string): boolean {
	return urlMatch(url, pineEditor__());
}

export function isDefaultChart(url: string): boolean {
	return urlMatch(url, chartDefault__());
}

/**
 * Check that specified match something like: 'tradingview.com/chart/...'
 */
export function isChartUrl(url: string): boolean {
	return urlMatch(url, chartRe__());
}

function isChartUrlFromURLObject(url: URL): boolean {
	return url.pathname.startsWith('/chart');
}

/* Check that specified all screeners
*
* for example: 'tradingview.com/screener/', 'https://www.tradingview.com/forex-screener/
*/
export function isAnyScreener(url: string): boolean {
	return urlMatch(url, isAnyScreener__());
}

/**
 * Check that specified match something like: 'tradingview.com/chart/.../?...'
 */
export function isChartUrlWithParams(url: string): boolean {
	return urlMatch(url, chartWithParamsRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/screener/...'
 */
export function isStockScreenerUrl(url: string): boolean {
	return urlMatch(url, screenerRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/heatmap/...'
 */
export function isHeatmapUrl(url: string): boolean {
	return urlMatch(url, heatmapRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/community/...'
 */
export function isCommunityUrl(url: string): boolean {
	return urlMatch(url, communityRe__());
}

export function isCommunityIdeaUrl(url: string): boolean {
	return urlMatch(url, isCommunityIdeaRe__());
}

export function isCommunityIndicatorsUrl(url: string): boolean {
	return urlMatch(url, isCommunityIndicatorsRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/chart/.../...'
 */
export function isIdeaUrl(url: string): boolean {
	return urlMatch(url, ideaRe__());
}

/**
 * Check that specified match like: 'tradingview.com/pine-script-docs/en/v5/Introduction.html'
 */
export function isPineScriptManualUrl(url: string): boolean {
	return urlMatch(url, pineScriptManualRe__());
}

/**
 * Check that specified match like: 'tradingview.com/pine-script-reference/v5/'
 */
export function isPineScriptReferenceUrl(url: string): boolean {
	return urlMatch(url, pineScriptReferenceRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/x/...'
 */
export function isScreenshotUrl(url: string): boolean {
	return urlMatch(url, isScreenshotRe__());
}

/**
 * Check that specified match any url that belongs to the current TV host: 'tradingview.com/...'
 */
export function isTVHostedUrl(url: string): boolean {
	return urlMatch(url, isTVRe__());
}

export function isTradingviewProtocol(url: string): boolean {
	return urlMatch(url, tradingviewLinkRe);
}

/**
 * Check that specified match something like: 'tradingview.com/account-recovery/...'
 */
export function isAccountRecoveryUrl(url: string): boolean {
	return urlMatch(url, accountRecoveryRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/chat/...'
 */
export function isDetachedChatUrl(url: string): boolean {
	return urlMatch(url, detachedChatRe__());
}

/**
 * Check than specified match something like: 'https://s3.tradingview.com/snapshots/...' or https://s3.amazonaws.com/tradingview-beta-staging/snapshots/...'
 */
export function isSnapshotUrl(url: string): boolean {
	return urlMatch(url, isSnapshotRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/markets/.../news/'
 */
export function isMarketNewsUrl(url: string): boolean {
	return urlMatch(url, marketNewsRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/markets/stocks-usa/...'
 */
export function isCountriesUrl(url: string): boolean {
	return urlMatch(url, countriesRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/markets/world-economy/...'
 */
export function isWorldEconomyUrl(url: string): boolean {
	return urlMatch(url, worldEconomyRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/u/TradingView/'
 */
export function isFollowTVUrl(url: string): boolean {
	return urlMatch(url, followTVRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/news/...'
 */
export function isNewsUrl(url: string): boolean {
	return urlMatch(url, newsRe__());
}

/**
 * Check that specified match like: 'tradingview.com/news/'
 */
export function isNewsExactUrl(url: string): boolean {
	return urlMatch(url, newsExactRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/news/?market=stock'
 */
export function isNewsSectionUrl(url: string): boolean {
	return urlMatch(url, newsSectionsRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/news/?market=topstories'
 */
export function isNewsTopStories(url: string): boolean {
	return urlMatch(url, newsTopStoriesRe__());
}

/**
 * Check that specified match like: 'tradingview.com/HTML5-stock-forex-bitcoin-charting-library/'
 */
export function isForBusinessChartingUrl(url: string): boolean {
	return urlMatch(url, forBusinessChartingRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/suppot/...'
 */
export function isSupportUrl(url: string): boolean {
	return urlMatch(url, supportRe__());
}

/**
 * Check that specified match like: 'status.tradingview.com/'
 */
export function isStatusUrl(url: string): boolean {
	return urlMatch(url, statusRe__());
}

/**
 * Check that specified match any of the urls from news, heatmaps, screeners, snaps
 */
export function isHeaderVisibleUrl(url: string): boolean {
	return urlMatch(url, isHeaderVisibleUrlsRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/markets/...'
 */
export function isMarketUrl(url: string): boolean {
	return urlMatch(url, marketRe__());
}

/**
 * Check that specified match something like: 'tradingview.com/markets/bonds/...'
 */
export function isMarketBondsUrl(url: string): boolean {
	return urlMatch(url, marketBondsRe__());
}

/**
 * Check that specified match any of the urls from chart, screeners, markets
 */
export function isLinkableUrl(url: string): boolean {
	return urlMatch(url, linkableUrlsRe__());
}

export function getTargetTVDHostInRenderer(): string {
	return localStorage.getItem(TARGET_TVD_HOST) ?? DEFAULT_TVD_HOST;
}

export function isHiddenTradestationWindow(url: string): boolean {
	return urlMatch(url, makeUrlRegExp('${TV}/trading/logout/*'));
}

export function getPersistentUrl(url: string): string {
	try {
		return format(
			new URL(url),
			{ auth: false, fragment: false, search: false }
		);
	}
	catch (error) {
		if (error instanceof Error) {
			error.message = `${ error.message }, url: ${ url }`;
		}

		throw error;
	}
}

export function getPersistentChartUrl(url: string): string {
	try {
		return isChartUrlFromURLObject(new URL(url)) ? getPersistentUrl(url) : url;
	}
	catch (error) {
		if (error instanceof Error) {
			error.message = `${ error.message }, url: ${ url }`;
		}

		throw error;
	}
}
