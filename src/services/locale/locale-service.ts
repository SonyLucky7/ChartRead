import { app, IncomingMessage, net, session } from 'electron';
import { BehaviorSubject, Subject } from 'rxjs';

import { HttpResponseCode, post } from '../../http';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { API_CHANGE_LANGUAGE, resolveWebsiteRoot } from '../../tv-api';
import { getMessageOfError } from '../../tvd-runtime/core';
import { lazy, makeUrlRegExp } from '../../utils';
import { isRtlHelper } from '../../utils/locale';
import { appSettingsService } from '../app-settings-service';
import { getConfiguration } from '../configuration';
import { CLAIM_LAST_LOCALE, userService } from '../user';
import { l10nToi18nMap } from './i10n-locales';
import { ILocaleService, LOCALE_SERVICE_CONTRACT } from './ilocale-service';

/**
 * Localization relies on fact that different locales uses different domains (like ru.tradingview. , br.tradingview ...).
 * So when localization service see the URL that belongs to the (any) tradingview host it will modify such url to make it 'localized'.
 * (i.e. if current locale 'ru' any https://XY.tradingview.com/whatever  will be trasformed to https://ru.tradingview.com/whatever ).
 * But some  URL must remains unchanged. To detect such URLS nonLocalizableUrls are used.
 */
export const userProfileUrl = /:\/\/\w+\.tradingview\.com\/u\/\w+\//i;

const nonLocalizableUrls: RegExp[] = [
	/:\/\/s3\..+\/(snapshots\/)?/i, // match like [https://s3.tradingview.com/snapshots/g/Gp2BSmQ0.png, https://s3.amazonaws.com/tradingview-beta-staging/snapshots/r/RCyjlMeh.png, etc]
	/:\/\/status\.tradingview\.com/i,
	/:\/\/news-mediator\.tradingview\.com/i,
];

function resolveLocaleAwareHost(): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const hostUrl = getConfiguration().urls.defaultHost;

		const request = net.request({
			method: 'GET',
			url: hostUrl,
			session: session.defaultSession,
			useSessionCookies: true,
		});

		let resolved = false;
		// request.setHeader('X-Requested-With', 'XMLHttpRequest');
		request.on('redirect', (code: number, method: string, redirectUrl: string) => {
			if (code === HttpResponseCode.Redirect) {
				resolved = true;
				request.abort();
				resolve(redirectUrl);
			}
		});

		request.on('response', (result: IncomingMessage) => {
			if (resolved) {
				return;
			}

			if (result.statusCode === HttpResponseCode.OK) {
				resolve(hostUrl);
			}
			else {
				const message = `[LocaleService.resolveLocaleAwareHost()] Fail to resolve locale aware host. (${ result.statusCode }): ${ result.statusMessage }`;
				loggerService().error(message);
				reject(new Error(message));
			}
		});

		request.end();
	});
}

// eslint-disable-next-line no-useless-escape
const tvRe__ = lazy(() => makeUrlRegExp('${TV}\/', false) as RegExp);

@ExposeSingletonService(LOCALE_SERVICE_CONTRACT, IpcServices.getProvider())
export class LocaleService implements ILocaleService {
	private readonly defaultLocale: string = 'en';
	#locale = '';
	private systemLocale = '';
	private localeAwareHost?: string;

	private readonly localeChangeEvent = new BehaviorSubject<string>(this.defaultLocale);
	readonly localeChange = this.localeChangeEvent.asObservable();

	private readonly localeInitializeEvent = new Subject<boolean>();
	readonly localeInitialize = this.localeInitializeEvent.asObservable();

	constructor() {
		loggerService().debug('Initializing LocaleService');

		this.systemLocale = app.getLocale().toLowerCase();
		this.defaultLocale = this.resolvel10nLangCode(this.systemLocale);

		userService().userSignedOut.subscribe({
			next: () => {
				this.setFallbackLocale();
			},

			error: (err) => loggerService().error('error prepareUserSignIn', err),
		});

		userService().prepareUserSignIn.subscribe({
			next: (data): void => {
				const setupLocale = async(): Promise<void> => {
					let localeAwareHost = await resolveLocaleAwareHost();
					const lastLocale = data.user.getClaim(CLAIM_LAST_LOCALE);

					if (typeof lastLocale === 'string' && lastLocale !== '') {
						this.locale = lastLocale;
						appSettingsService().set('currentLocale', lastLocale);
					}
					else {
						this.locale = appSettingsService().get('currentLocale') ?? this.defaultLocale;
					}

					if (!localeAwareHost.endsWith('/')) {
						localeAwareHost = localeAwareHost + '/';
					}

					const match = tvRe__().exec(localeAwareHost);
					if (match && match.length > 0) {
						this.localeAwareHost = localeAwareHost;
					}
					else {
						// throw new Error(`Unexpected locale aware host: (${localeAwareHost})`);
					}

					loggerService().info(`Locale info. locale: '${ this.locale || 'undefined' }', host: '${ this.localeAwareHost || 'undefined' }'`);
					if (typeof this.locale !== 'undefined') {
						this.localeChangeEvent.next(this.locale);
					}
				};

				data.workAcceptor(setupLocale());
			},

			error: (err) => loggerService().error('error prepareUserSignIn', err),
		});
	}

	private set locale(lang: string) {
		this.#locale = lang === 'in' ? 'en_IN' : lang;
	}

	private get locale(): string {
		return this.#locale;
	}

	currentLocale(): string {
		return this.locale ?? this.defaultLocale;
	}

	isRtlSystemIpc(): Promise<boolean> {
		return Promise.resolve(isRtlHelper(this.systemLocale));
	}

	isRtlSystem(): boolean {
		return isRtlHelper(this.systemLocale);
	}

	isRtl(): boolean {
		if (!this.locale) {
			return false;
		}
		return isRtlHelper(this.locale);
	}

	getLocaleAwareHost(): string {
		return this.localeAwareHost ?? getConfiguration().urls.defaultHost;
	}

	getLocaleAwareHostIpc(): Promise<string> {
		return Promise.resolve(this.getLocaleAwareHost());
	}

	localeAwareUrl(url: string): string {
		if (!this.localeAwareHost) {
			return url;
		}

		if (nonLocalizableUrls.some((re) => re.test(url))) {
			console.log(`Non translatable URL: (${ url })`);
			return url;
		}

		const newUrl = url.replace(tvRe__(), this.getLocaleAwareHost());
		return newUrl;
	}

	async setLocale(lang: string): Promise<void> {
		try {
			loggerService().info(`Attempt to change lang (${ lang })`);
			// ?tvd_pass_through= temporary needed while AppEventService listen for webRequest.onBeforeRequest( {urls: ['*://*/change_language/']},
			// adding ?tvd_pass_through= will prevent recursion (becuase AppEventService will not handle such url).
			const apiUrl = this.localeAwareUrl(resolveWebsiteRoot(`${ API_CHANGE_LANGUAGE }?tvd_pass_through=`));
			//

			const content = `language=${ lang }`;
			const headers = {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				'Accept': '*/*',
				'Referer': this.getLocaleAwareHost(),
				'Content-Type': 'application/x-www-form-urlencoded',
				/* eslint-enable camelcase, @typescript-eslint/naming-convention*/
			};

			const redirectHandler = (url: string): Buffer | undefined => {
				return Buffer.from(url, 'utf-8');
			};

			const response = await post({
				url: apiUrl,
				requestData: { headers, body: { content }, redirectHandler },
				session: session.defaultSession,
			});

			this.localeAwareHost = response?.data?.toString() ?? '';
			this.locale = lang;
			appSettingsService().set('currentLocale', this.locale);
		}
		catch (error: unknown) {
			this.locale = appSettingsService().get('currentLocale');
			loggerService().error(`Fail to change language (${ lang }): ${ getMessageOfError(error) }`);
		}
		finally {
			this.localeChangeEvent.next(this.locale);
			this.localeInitializeEvent.next(true);
		}
	}

	private setFallbackLocale(): void {
		delete this.localeAwareHost;

		this.setLocale(this.defaultLocale)
			.catch((error) => {
				loggerService().error('LocaleService().setFallbackLocale(): setLocale() error', error);
			});
	}

	private resolvel10nLangCode(code: string): string {
		const i18nCode = l10nToi18nMap.find((l) => l.regex.test(code));

		return i18nCode?.code ?? this.defaultLocale;
	}
}
