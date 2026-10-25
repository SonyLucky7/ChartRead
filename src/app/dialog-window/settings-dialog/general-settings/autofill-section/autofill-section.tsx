import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@tradingview/ui-lib/checkbox';

import { settingsProviderProxy } from '../../../../../services/settings';
import { isLinux } from '../../../../../utils';
import { useObservable } from '../../../../components-ui/hooks';
import { SettingsSection } from '../../settings-section';
import { useKeyDownHandler } from '../../use-keydown-handler';

import './autofill-section.css';

const isAutofillAvailable = !isLinux();

const AUTOFILL_CREDENTIALS_CHECKBOX_ID = 'autofillBrokerCredentials';
const CROSSHAIR_SYNC_CHECKBOX_ID = 'syncCrosshairAcrossWindows';

const keyDownCheckboxActions: Record<string, RxJSNext<boolean>> = {
	[AUTOFILL_CREDENTIALS_CHECKBOX_ID]: settingsProviderProxy().autofillChange.next,
	[CROSSHAIR_SYNC_CHECKBOX_ID]: settingsProviderProxy().crosshairSyncEnabledChange.next,
};

export const AutofillSection = (): JSX.Element => {
	const { t } = useTranslation();

	const [isCredentialAutofillOn, setIsCredentialAutofillOn] = useState<boolean>(false);
	const [isCrosshairSyncOn, setIsCrosshairSyncOn] = useState<boolean>(false);

	useObservable<boolean>(settingsProviderProxy().autofillChange, setIsCredentialAutofillOn);
	useObservable<boolean>(settingsProviderProxy().crosshairSyncEnabledChange, setIsCrosshairSyncOn);

	useKeyDownHandler(keyDownCheckboxActions);

	const toggleCredentialsAutofill = (): void => {
		settingsProviderProxy().autofillChange.next(!isCredentialAutofillOn);
	};

	const toggleCrosshairSync = (): void => {
		settingsProviderProxy().crosshairSyncEnabledChange.next(!isCrosshairSyncOn);
	};

	return (
		<SettingsSection
			className='credentials-and-crosshair'
			label={ isAutofillAvailable ? t('CREDENTIALS AND CROSSHAIR') : t('CROSSHAIR') }
		>
			{ isAutofillAvailable &&
				<Checkbox
					id={ AUTOFILL_CREDENTIALS_CHECKBOX_ID }
					checked={ isCredentialAutofillOn }
					onChange={ toggleCredentialsAutofill }
					label={ t('Auto-fill broker credentials') }
					tabIndex={ 1 }
				/>
			}
			<Checkbox
				id={ CROSSHAIR_SYNC_CHECKBOX_ID }
				checked={ isCrosshairSyncOn }
				onChange={ toggleCrosshairSync }
				label={ t('Sync crosshair across windows') }
				tabIndex={ 1 }
			/>
		</SettingsSection>
	);
};
