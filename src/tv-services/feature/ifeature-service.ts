export const FEATURE_SERVICE_CONTRACT = 'tvd:tv-feature-service';

// TODO: remove in TVD-2871
export const TIME_AND_DATE_RANGE_LINKING_FEATURE = 'tvd_time_and_date_range_linking';
// TODO: remove in TVD-2790
export const TVD_BACKGROUND_THROTTLING = 'tvd_background_throttling';
// TODO: remove in TVD-2985
// NOTE: the value was changed before the release to escape a situation when a half ready
// feature is opened to some users. to be returned back to the original value after the release
export const TVD_TAB_GROUPS = 'tvd_tab_groups_invalidated';
// TODO: remove in TVD-3013
export const SHOW_MCP_SERVER_LINKS = 'show_mcp_server_links';

/**
 * web toggles hiding product entry points
 */
export const enum SunsetCandidateProduct {
	NEWS_FLOW = 'tvd_hide_news_flow_entry_points',
	FUNDAMENTAL_GRAPHS = 'hide_fundamentals_entry_points',
}

export interface IFeatureService {
	isFeatureEnabled(key: string, defaultValue: boolean): boolean;
}
