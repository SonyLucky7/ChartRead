import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@tradingview/ui-lib/checkbox';

import { settingsProviderProxy } from '../../../../services/settings';
import { useObservable } from '../../../components-ui/hooks';
import { SettingsSection } from '../settings-section';
import { useKeyDownHandler } from '../use-keydown-handler';
import { AlertVolumeSlider } from './alert-volume-slider';

import './alerts-settings.css';

const ALERT_CHECKBOX_ID = 'alertNotificationEnabledChange';

const keyDownCheckboxActions: Record<string, RxJSNext<boolean>> = {
	[ALERT_CHECKBOX_ID]: settingsProviderProxy().alertNotificationEnabledChange.next,
};

export const AlertsSettings = (): JSX.Element => {
	const { t } = useTranslation();

	const [isAlertsOn, setIsAlertsOn] = useState<boolean>(false);

	useObservable<boolean>(settingsProviderProxy().alertNotificationEnabledChange, setIsAlertsOn);

	useKeyDownHandler(keyDownCheckboxActions);

	const toggleAlertChange = (): void => {
		settingsProviderProxy().alertNotificationEnabledChange.next(!isAlertsOn);
	};

	return (
		<>
			<SettingsSection className='alerts' label={ t('NOTIFICATIONS') }>
				<Checkbox
					id={ ALERT_CHECKBOX_ID }
					className='alerts-checkbox'
					checked={ isAlertsOn }
					onChange={ toggleAlertChange }
					label={ t('Use system notifications for alerts') }
					tabIndex={ 1 }
				/>
			</SettingsSection>
			<SettingsSection label={ t('SOUND') }>
				<AlertVolumeSlider />
			</SettingsSection>
		</>
	);
};
