import { localeService } from '../services/locale';

export const API_CURRENT_USER = '/api/v1/user/profile/me/';
export const API_CHART_TOKEN = '/chart-token/';
export const API_GET_LAYOUT_DRAWINGS_INFO = 'https://charts-storage.tradingview.com/charts-storage/layout/';
export const API_DELETE_LAYOUT = '/api/v1/charts/delete/';
export const API_LOGOUT = '/accounts/logout/';
export const API_CHANGE_LANGUAGE = '/change_language/';
export const API_TVD_AUTH = '/accounts/tvd/connect/';
export const API_TVD_AUTH_COMPLETE = '/accounts/tvd/complete/';
export const API_TVD_2FA = '/accounts/two-factor/complete/';
export const UNABLE_UPDATE_APP = 'https://www.tradingview.com/?solution=43000706464';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getApiCSRFHeaders(): { Referer: string; } {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	return { Referer: localeService().getLocaleAwareHost() };
}
