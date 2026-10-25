import { i18n } from 'i18next';
import { useEffect } from 'react';

export function useLocalTabTitleTranslation(i18nInstance: i18n, title: string): void {
	useEffect(() => {
		document.title = title;
		i18nInstance.on('languageChanged', () => { document.title = title; });
	}, [i18nInstance, title]);
}
