import { Observable } from 'rxjs';

export const LOCALE_SERVICE_CONTRACT = 'tvd:locale-service';

export interface ILocaleService {
	localeInitialize: Observable<boolean>;
	localeChange: Observable<string>;
	currentLocale(): string;
	getLocaleAwareHost(): string;
	localeAwareUrl(url: string): string;
	setLocale(code: string): void;

	isRtlSystem(): boolean;
	isRtl(): boolean;
}
