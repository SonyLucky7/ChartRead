import { useEffect } from 'react';
import { useTranslation, UseTranslationResponse } from 'react-i18next';

import { setupI18nLocaleHandler } from '../../../services/locale';

/**
 * @param htmlElement is used to specify an HTML element on which
 * a dir attribute will be changed when a locale is changed
 */
export function useI18n(htmlElement?: HTMLElement): UseTranslationResponse<'translation'> {
	const translation = useTranslation();

	useEffect(() => {
		setupI18nLocaleHandler(htmlElement);
	}, [htmlElement]);

	return translation;
}
