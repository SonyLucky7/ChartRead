import i18next from 'i18next';
import i18n from '.';

export const changeLanguage = async (locale: string): Promise<void> => {
	if (i18n.language === locale) {
		return;
	}

	await i18next.changeLanguage(locale);
};
