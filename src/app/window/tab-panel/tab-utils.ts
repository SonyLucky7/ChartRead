// import { MouseEvent } from 'react';

import { urlPathnames } from '../../../services/window/tab/tab-title-api';

// import { isDarwin } from '../../utils/platform';
import BrokersFavicon from './assets/brokers-favicon.svg';
import CommunityFavicon from './assets/community-favicon.svg';
import CountriesFavicon from './assets/countries-favicon.svg';
import DisclaimerFavicon from './assets/disclaimer-favicon.svg';
import EconomicCalendar from './assets/economic-calendar-favicon.svg';
import ErrorViewFavicon from './assets/error-view-favicon.svg';
import ForBusinessFavicon from './assets/for-business-favicon.svg';
import FundamentalGraphsFavicon from './assets/fundamental-graphs-favicon.svg';
import HeatmapFavicon from './assets/heatmap-favicon.svg';
import HelpCenterFavicon from './assets/help-center-favicon.svg';
import IdeaFavicon from './assets/idea-favicon.svg';
import LicencesFavicon from './assets/licences-favicon.svg';
import MacroMapsFavicon from './assets/macro-maps-favicon.svg';
import MobileAppFavicon from './assets/mobile-app-favicon.svg';
import ModeratorsFavicon from './assets/moderators-favicon.svg';
import NewsFlowFavicon from './assets/news-flow-favicon.svg';
import OptionsFavicon from './assets/options-favicon.svg';
import PolicyFavicon from './assets/policy-favicon.svg';
import PortfolioFavicon from './assets/portfolio-favicon.svg';
import ReferFavicon from './assets/refer-favicon.svg';
import ScreenerFavicon from './assets/screener-favicon.svg';
import ScriptsFavicon from './assets/scripts-favicon.svg';
import SnapsFavicon from './assets/snaps-favicon.svg';
import SparksFavicon from './assets/sparks-favicon.svg';
import StatusFavicon from './assets/status-favicon.svg';
import StreamsFavicon from './assets/streams-favicon.svg';
import TVFavicon from './assets/tv-favicon.svg';
import WorldEconomyFavicon from './assets/world-economy-favicon.svg';
import YieldCurvesFavicon from './assets/yield-curves-favicon.svg';

export enum TabSize {
	Normal = '',
	Small = 'small',
	XSmall = 'xsmall',
	XXSmall = 'xxsmall',
}

export interface TabDragData {
	tabId: string;
}

export const enum TabFaviconsKey {
	Countries = 'countries',
	ErrorView = 'errorView',
	Follow = 'follow',
	Home = 'home',
	Ideas = 'ideas',
	Licenses = 'licenses',
	News = 'news',
	Status = 'status',
	Screener = 'screener',
	WorldEconomy = 'worldEconomy',
}

export const tabFavicons: Map<TabFaviconsKey | string, string> = new Map<TabFaviconsKey | string, string>([
	['about', TVFavicon],
	['advertising-info', ForBusinessFavicon],
	['athletes', TVFavicon],
	['bounty', PolicyFavicon],
	['broker-awards', BrokersFavicon],
	['brokerage-integration', ForBusinessFavicon],
	['brokers', BrokersFavicon],
	['careers', TVFavicon],
	[urlPathnames.community, CommunityFavicon],
	['cookies-policy', PolicyFavicon],
	[TabFaviconsKey.Countries, CountriesFavicon],
	['data-coverage', TVFavicon],
	['disclaimer', DisclaimerFavicon],
	[urlPathnames.economicCalendar, EconomicCalendar],
	[urlPathnames.earningsCalendar, EconomicCalendar],
	[urlPathnames.dividendCalendar, EconomicCalendar],
	[urlPathnames.ipoCalendar, EconomicCalendar],
	[urlPathnames.revenueCalendar, EconomicCalendar],
	['education', IdeaFavicon],
	[TabFaviconsKey.ErrorView, ErrorViewFavicon],
	['features', TVFavicon],
	[TabFaviconsKey.Follow, TVFavicon],
	['heatmap', HeatmapFavicon],
	[TabFaviconsKey.Home, TVFavicon],
	['house-rules', TVFavicon],
	['html5-stock-forex-bitcoin-charting-library', ForBusinessFavicon],
	[TabFaviconsKey.Ideas, IdeaFavicon],
	[TabFaviconsKey.Licenses, LicencesFavicon],
	['lightweight-charts', ForBusinessFavicon],
	['manifesto', TVFavicon],
	['markets', WorldEconomyFavicon],
	['mobile', MobileAppFavicon],
	['moderators', ModeratorsFavicon],
	[TabFaviconsKey.News, NewsFlowFavicon],
	[urlPathnames.newsFlow, NewsFlowFavicon],
	[urlPathnames.options, OptionsFavicon],
	['partner-program', ForBusinessFavicon],
	['pine-script-docs', ScriptsFavicon],
	['pine-script-reference', ScriptsFavicon],
	['pine-wizards', ScriptsFavicon],
	['policies', PolicyFavicon],
	['privacy-policy', PolicyFavicon],
	['referral-program', ForBusinessFavicon],
	[TabFaviconsKey.Screener, ScreenerFavicon],
	['script', ScriptsFavicon],
	['scripts', ScriptsFavicon],
	['share-your-love', ReferFavicon],
	['snaps', SnapsFavicon],
	['sparks', SparksFavicon],
	[TabFaviconsKey.Status, StatusFavicon],
	['streams', StreamsFavicon],
	[urlPathnames.helpCenter, HelpCenterFavicon],
	['tradingview-for-the-web', ForBusinessFavicon],
	['wall-of-love', TVFavicon],
	['widget', ForBusinessFavicon],
	[TabFaviconsKey.WorldEconomy, WorldEconomyFavicon],
	[urlPathnames.fundamentalGraphs, FundamentalGraphsFavicon],
	[urlPathnames.macroMaps, MacroMapsFavicon],
	[urlPathnames.portfolios, PortfolioFavicon],
	[urlPathnames.yieldCurves, YieldCurvesFavicon],
]);
