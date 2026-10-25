import { Cookie, nativeTheme, screen, session } from 'electron';

import { HttpRequestData, post } from '../../http';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { networkService } from '../../main/network';
import { getMessageOfError } from '../../tvd-runtime/core';
import { isWin32 } from '../../utils';
import { getInstallationSource, InstallationSource } from '../../utils/installation-source';
import { safeJsonParse } from '../../utils/json-parse';
import { Win32Utils } from '../../utils/os-utils';
import { appEventService } from '../app-event-service';
import { appSettingsService } from '../app-settings-service';
import { getConfiguration } from '../configuration';
import { AppWindows, BuildInfo } from '../interfaces';
import { localeService } from '../locale';
import { mainService } from '../main-service';
import { settingsProvider } from '../settings';
import { isDefaultTabTitleElementsOrder } from '../settings/tab-title-interfaces';
import { ClaimsContainer, User } from '../user';
import * as Claims from '../user/claims';
import { windowService } from '../window';
import { AnalyticsEvent, GA4AnalyticsEvent, GA4AnalyticsEventConverter, IEventConverter } from './analytics-events';
import { AnalyticsCookiesNames, CookiesSettings, isCookiesSettingsData, ITrackEventService, TRACK_EVENT_SERVICE_CONTRACT } from './itrack-event-service';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const CLEAR_ERRORS_TIMEOUT = 5 * 60 * 1000;

@ExposeSingletonService(TRACK_EVENT_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('TrackEventService')
export class TrackEventService implements ITrackEventService {
	private googleQuery =
		generateGoogleQuery(
			getConfiguration().googleAnalytics.key, getConfiguration().googleAnalytics.measurementId);

	private cid: string | undefined;
	private buildInfo: Promise<BuildInfo> | undefined;
	private appWindowsData: AppWindows | undefined;
	private osData: string | undefined;
	private user: User | undefined;

	private firstRunEvent: true | undefined;
	private networkStatusChange = true;
	private trackEventErrors: string[] = [];
	private clearArrayOfEventTrackingErrors?: NodeJS.Timeout;

	private appStartTracked = false;
	private isAppTrackingEnabled?: boolean;
	private eventConverter: IEventConverter<unknown> | undefined;

	private isDevMode = getConfiguration().googleAnalytics.analyticsDevModeSettings.isDevMode;
	private devModeCid = getConfiguration().googleAnalytics.analyticsDevModeSettings.devModeCid;

	constructor() {
		loggerService().debug('Initializing TrackEventService');

		networkService().networkStatusChange.subscribe(status => {
			this.networkStatusChange = status;
		});

		appEventService().startup.subscribe(() => {
			loggerService().debug('TrackEventService().Startup()');
			this.cid = appEventService().getCid();
			this.buildInfo = mainService().getVersionInfo();

			session.defaultSession.cookies.on('changed', (ev, cookie) => {
				if (!this.isAnalyticsCookie(cookie.name)) {
					return;
				}

				this.updateAppTrackingStatus(cookie)
					.then(() => {
						if (!this.firstRunEvent) {
							return;
						}

						return this.trackStartApp();
					})
					.catch((error) => {
						loggerService().error(`TrackEventService().constructor() error - ${ getMessageOfError(error) }`);
					});
			});
		});
	}

	@logCall
	setFirstRunEvent(): void {
		this.firstRunEvent = true;
	}

	@logCall
	setAppWindowsData(windows: number, tabs: number): void {
		this.appWindowsData = { windows, tabs };
	}

	@logCall
	setUserData(userClaims: ClaimsContainer): void {
		this.user = new User(userClaims);

		if (this.user.hasClaim(Claims.CLAIM_FIRSTTIME_INITIALIZATION, true)) {
			this.setAppWindowsData(1, 1);
			this.trackStartApp();
		}
	}

	@logCall
	async updateAppTrackingStatus(updatedCookie?: Cookie): Promise<void> {
		const TVCookies = updatedCookie
			? await Promise.resolve([updatedCookie])
			: await session.defaultSession.cookies.get({ url: getConfiguration().urls.defaultHost });

		const analyticsCookies = TVCookies.filter(cookie => this.isAnalyticsCookie(cookie.name));

		if (analyticsCookies.length === 0) {
			this.isAppTrackingEnabled = false;
			return;
		}

		const cookiesSettings = this.parseCookieSettings(analyticsCookies.find(cookie => cookie.name === AnalyticsCookiesNames.CookiesSettings)?.value);
		const cookiePrivacyPreferenceBanner = analyticsCookies
			.find(cookie => cookie.name !== AnalyticsCookiesNames.CookiePrivacyPreferenceBanner)?.value;

		this.setIsAppTrackingEnabled(cookiePrivacyPreferenceBanner, cookiesSettings);
	}

	private setIsAppTrackingEnabled(cookiePrivacyPreferenceBanner?: string, cookiesSettings?: CookiesSettings): void {
		if (!cookiePrivacyPreferenceBanner || cookiePrivacyPreferenceBanner === 'ignored') {
			this.isAppTrackingEnabled = false;
			return;
		}

		this.isAppTrackingEnabled = cookiesSettings?.analytics ?? false;
	}

	private isAnalyticsCookie(cookieName: string): boolean {
		return cookieName === AnalyticsCookiesNames.CookiePrivacyPreferenceBanner || cookieName === AnalyticsCookiesNames.CookiesSettings;
	}

	private parseCookieSettings(cookieValueString?: string): CookiesSettings | undefined {
		if (!cookieValueString) {
			return;
		}

		return safeJsonParse<CookiesSettings>(isCookiesSettingsData)(cookieValueString) ?? undefined;
	}

	@logCall
	trackStartApp(): void {
		if (this.appStartTracked) {
			return;
		}

		if (!this.isAppTrackingEnabled) {
			loggerService().info('[TrackEventService.trackStartApp()]: GA not allowed');
			return;
		}

		const isDefault = isDefaultTabTitleElementsOrder(settingsProvider().tabChange.value);

		const startAppEvent: AnalyticsEvent = {
			eventName: 'app_launched',
			parameters: {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				first_launch: this.firstRunEvent ? 'yes' : 'no',
				theme: this.getTheme(),
				display_count: screen.getAllDisplays().length,
				start_tab_count: this.appWindowsData?.tabs ?? 0,
				start_window_count: this.appWindowsData?.windows ?? 0,
				proxy: networkService().proxyEnabled() ? 'enabled' : 'disabled',
				tab_title: isDefault ? 'default' : 'customized',
				/* eslint-enable camelcase, @typescript-eslint/naming-convention*/
			},
		};

		this.appStartTracked = true;
		void this.sendEvent(startAppEvent);
	}

	private getTheme(): string {
		const theme = appSettingsService().get('theme');
		if (theme === 'system') {
			return nativeTheme.shouldUseDarkColors ? 'system-dark' : 'system-light';
		}

		return theme === 'dark' ? 'user-dark' : 'user-light';
	}

	@logCall
	trackCloseApp(sessionDuration: number): void {
		if (this.hasErrorsTrackEvent()) {
			return;
		}

		if (!this.isAppTrackingEnabled) {
			loggerService().info('[TrackEventService.trackCloseApp()]: GA not allowed');
			return;
		}

		const closeAppEvent: AnalyticsEvent = {
			eventName: 'app_quit',
			parameters: {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				session_length: sessionDuration,
				max_window_count: windowService().getMaxWindowsInSession(),
				/* eslint-enable camelcase, @typescript-eslint/naming-convention*/
			},
		};

		void this.sendEvent(closeAppEvent);
	}

	@logCall
	trackEvent(event: AnalyticsEvent): void {
		if (this.hasErrorsTrackEvent()) {
			return;
		}

		if (!this.isAppTrackingEnabled) {
			loggerService().info('TrackEventService.trackEvent(): GA not allowed');
			return;
		}

		void this.sendEvent(event);
	}

	private hasErrorsTrackEvent(): boolean {
		if (!this.networkStatusChange) {
			return true;
		}

		const hasErrors = this.trackEventErrors.length > 0;
		if (hasErrors && !this.clearArrayOfEventTrackingErrors) {
			this.clearArrayOfEventTrackingErrors = setTimeout(() => {
				this.trackEventErrors = [];
			}, CLEAR_ERRORS_TIMEOUT);
		}

		return hasErrors;
	}

	private async sendEvent(event: AnalyticsEvent): Promise<void> {
		const version = this.buildInfo && (await this.buildInfo).appVersion;

		if (!this.eventConverter) {
			this.eventConverter = setupConverter(version, this.getOSData(), getInstallationSource());
		}

		const requestData: HttpRequestData = {
			headers: {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				'Accept': '*/*',
				'Referer': localeService().getLocaleAwareHost(),
				'Content-Type': 'application/json',
				/* eslint-enable camelcase, @typescript-eslint/naming-convention */
			},
			body: {
				content: JSON.stringify({
					/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
					non_personalized_ads: true,
					events: [this.eventConverter.toAnalyticsEvent(event, this.isDevMode)],
					client_id: this.isDevMode ? this.devModeCid : this.cid,
					/* eslint-enable camelcase, @typescript-eslint/naming-convention */
				}),
			},
		};

		try {
			await post({ url: this.googleQuery, requestData, session: session.defaultSession });
		}
		catch (error: unknown) {
			loggerService().warn(
				`TrackEventService.sendEvent(event: ${ event.eventName }) is not sent due to error ${ getMessageOfError(error) }`
			);
		}
	}

	private getOSData(): string {
		if (this.osData) {
			return this.osData;
		}

		let osBuild = process.getSystemVersion();

		if (isWin32()) {
			try {
				const updateVersion = Win32Utils.windowsVersion();
				osBuild = `${ updateVersion.build }.${ updateVersion.updateBuildRevision }`;
			}
			catch (err) {
				loggerService().error('Error obtaining current Windows version', err);
			}
		}

		this.osData = `${ process.platform } ${ process.arch }  ${ osBuild }`;

		return this.osData;
	}
}

function setupConverter(appVersion = '', osVersion: string, installationSource: InstallationSource): IEventConverter<GA4AnalyticsEvent> {
	const converter = new GA4AnalyticsEventConverter(appVersion, osVersion, installationSource);

	return converter;
}

const generateGoogleQuery = (googleKey: string, measurementId: string): string => {
	const url = new URL('https://www.google-analytics.com/mp/collect?');

	url.searchParams.set('measurement_id', measurementId);
	url.searchParams.set('api_secret', googleKey);

	return url.toString();
};
