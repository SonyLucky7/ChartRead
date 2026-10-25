import '@sentry/electron/preload';

import { isCountriesUrl, isHeaderVisibleUrl, isMarketBondsUrl } from '../utils/tv-uri';
import { StyleManager } from './style-manager';

const currentUrl = window.location.href;

const hideElements = `
	.tv-market-heatmap__standalone-title-wrap,
	.tv-screener__standalone-title-wrap,
	.tv-footer {
		display: none !important;
	}

	${ isHeaderVisibleUrl(currentUrl) ? '' : '.tv-header { display: none !important; }' }

	${ isCountriesUrl(currentUrl)
		? ''
		: `.tv-economic-calendar [class^="separator"],
		.tv-content [class^="container"] [class^="marketHeader"],
		.tv-content .tv-category__tab-page [class^="marketHeader"],
		.tv-sticky-symbol-header,
		.tv-screener-toolbar {
			top: 0 !important;
		}` }

	.tv-content .tv-category__tab-page [class^="shadow"] [class^="tableWrapSticky"] {
		top: 58px !important;
	}

	.tv-content .tv-economy-country-tab [class^="table"] [class^="stickyContainer"],
	.tv-content .tv-economy-indicator-tab [class^="table"] [class^="stickyContainer"] {
		top: -1px !important;
	}

	.tv-content [class^="container"] [class^="shadow"] [class^="tableWrapSticky"] {
		top: ${ isMarketBondsUrl(currentUrl) ? '-1px' : '58px' }
	}

	.tv-category__tab-page.tv-card-exterior > .screener-markets-page-container > div {
		--screener-sticky-offset-top: 63px !important;
	}

	.tv-screener__standalone-wrap {
		padding: 0 !important;
	}

	.i-hidden-on-tvdesktop {
		display: none !important;
	}
`;

export function optimizeDesktopSpace(): void {
	const optimizeLayout = (): void => {
		const styleManager = new StyleManager(
			'desktopOptimize',
			hideElements
		);

		styleManager.applyRules();
	};

	window.addEventListener('load', optimizeLayout);
	window.addEventListener('unload', () => {
		window.removeEventListener('load', optimizeLayout);
	});

	optimizeLayout();
}
