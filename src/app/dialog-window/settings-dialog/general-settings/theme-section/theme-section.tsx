import React from 'react';
import { useTranslation } from 'react-i18next';

import { ThemePicker } from '../../../../components-ui/theme-picker';
import { SettingsSection } from '../../settings-section';

import './theme-section.css';

export const ThemeSection = (): JSX.Element => {
	const { t } = useTranslation();

	return (
		<SettingsSection label={ t('THEME') }>
			<ThemePicker tabIndex={ 1 } />
		</SettingsSection>
	);
};
