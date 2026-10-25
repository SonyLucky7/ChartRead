import { i18n as I18n } from 'i18next';

const ARABIC = ['ar', 'ar_AE'];
const HEBREW = ['he', 'he_IL'];

export type Direction = 'ltr' | 'rtl';

export const isRtlHelper = (locale: string): boolean => [...ARABIC, ...HEBREW].includes(locale);

export const isRtlRender = (): boolean => window.document.dir === 'rtl';

export function changeHtmlDirectionHelper(isRtl: boolean): void {
	document.querySelector('html')?.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
}

function getDirection(i18n: I18n): Direction {
	return i18n.dir(i18n.language.split('_')[0]);
}

export function setDirection(i18n: I18n): void {
	document.dir = getDirection(i18n);
}
