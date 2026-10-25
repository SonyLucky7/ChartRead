import { ipcMain } from 'electron';
import { Subscription } from 'rxjs';

import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { isRtlHelper } from '../../utils/locale';
import i18n from './i18n';
import { changeLanguage } from './i18n/change-language';
import { ILocaleService, LOCALE_SERVICE_CONTRACT } from './ilocale-service';

export * from './ilocale-service';
export * from './i18n/change-language';
export * from './i18n';

const isMainProcess = typeof ipcMain !== 'undefined';

export function localeService(): ILocaleService {
	return IpcServices.provide<ILocaleService>(LOCALE_SERVICE_CONTRACT);
}

export function localeServiceProxy(): Promisify<ILocaleService> {
	return IpcServices.provideProxy<ILocaleService>(LOCALE_SERVICE_CONTRACT);
}

function setElementDirection(element: HTMLElement, isRtl: boolean): void {
	element.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
}

function setupI18nLocaleHandlerCustom(onLocaleChange: (lang: string) => void): () => void {
	let subscription: Subscription | undefined;
	if (isMainProcess) {
		subscription = localeService().localeChange.subscribe(onLocaleChange);
	}
	else {
		subscription = localeServiceProxy().localeChange.subscribe(onLocaleChange);
	}

	const unsubscribe = (): void => {
		subscription?.unsubscribe();
		subscription = undefined;
		window.removeEventListener('beforeunload', unsubscribe);
	};

	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', unsubscribe);
	}
	return unsubscribe;
}

/**
 * @param htmlElement is used to specify an HTML element on which
 * a dir attribute will be changed when a locale is changed
 */
export function setupI18nLocaleHandler(htmlElement?: HTMLElement): void {
	if (htmlElement && htmlElement.dir === '') {
		setElementDirection(htmlElement, isRtlHelper(i18n.language));
	}

	const changeLanguageHandler = (lang: string): void => {
		if (lang === '') {
			return;
		}

		changeLanguage(lang)
			.catch((error) => {
				loggerServiceProxy().error('setupI18nLocaleHandler(): changeLocale() error', error);
			});

		if (!htmlElement) {
			return;
		}

		setElementDirection(htmlElement, isRtlHelper(lang));
	};

	setupI18nLocaleHandlerCustom(changeLanguageHandler);
}
