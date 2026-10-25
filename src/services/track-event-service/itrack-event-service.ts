import { Cookie } from 'electron';

import { ClaimsContainer } from '../user';
import { AnalyticsEvent } from './analytics-events';

export const TRACK_EVENT_SERVICE_CONTRACT = 'tvd:track-event-service';

export type CookiePrivacyPreferenceBanner = 'ignored' | 'accepted' | 'notApplicable'

export enum AnalyticsCookiesNames {
	CookiesSettings = 'cookiesSettings',
	CookiePrivacyPreferenceBanner = 'cookiePrivacyPreferenceBannerProduction',
}

export interface CookiesSettings {
	analytics: boolean;
	advertising: boolean;
}

export function isCookiesSettingsData(value: any): value is CookiesSettings {
	return typeof value === 'object' && 'analytics' in value && 'advertising' in value;
}

export interface ITrackEventService {
	trackEvent(event: AnalyticsEvent): void;
	trackStartApp(): void;
	trackCloseApp(sessionDuration: number): void;
	setAppWindowsData(windows: number, tabs: number): void;
	setUserData(userClaims: ClaimsContainer): void;
	setFirstRunEvent(): void;
	updateAppTrackingStatus(updatedCookie?: Cookie): Promise<void>;
}
