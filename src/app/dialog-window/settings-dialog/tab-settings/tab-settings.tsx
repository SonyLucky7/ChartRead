import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Checkbox } from '@tradingview/ui-lib/checkbox';

import { loggerServiceProxy } from '../../../../logger';
import { settingsProviderProxy } from '../../../../services/settings';
import { DEFAULT_TAB_SETTINGS } from '../../../../services/settings/tab-title-interfaces';
import { isDarwin } from '../../../../utils';
import { useObservable } from '../../../components-ui/hooks';
import { SettingsSection } from '../settings-section';
import { useKeyDownHandler } from '../use-keydown-handler';
import { TabTitleOrderSettings } from './tab-title-order-settings';

import './tab-settings.css';

const AUTO_RESTORE_CHECKBOX_ID = 'autoRestoreTickersAndIntervals';
const HIDE_TABS_IN_FULL_SCREEN_CHECKBOX_ID = 'hideTabsInFullScreenMode';

const keyDownCheckboxActions: Record<string, RxJSNext<boolean>> = {
	[AUTO_RESTORE_CHECKBOX_ID]: settingsProviderProxy().saveSymbolIntervalChange.next,
	[HIDE_TABS_IN_FULL_SCREEN_CHECKBOX_ID]: settingsProviderProxy().macosHideTabsInFullscreenChange.next,
};

const setDefaultTabSettings = (): void => {
	loggerServiceProxy().info('<TabSettings>: setDefaultTabSettings()');
	settingsProviderProxy().tabChange.next(DEFAULT_TAB_SETTINGS);
};

export const TabSettings = (): JSX.Element => {
	const { t } = useTranslation();

	const [isSaveSymbolIntervalOn, setIsSaveSymbolIntervalOn] = useState<boolean>(false);
	const [isHideTabsInFullScreenOn, setIsHideTabsInFullScreenOn] = useState<boolean>(false);

	useObservable<boolean>(settingsProviderProxy().saveSymbolIntervalChange, setIsSaveSymbolIntervalOn);
	useObservable<boolean>(settingsProviderProxy().macosHideTabsInFullscreenChange, setIsHideTabsInFullScreenOn);

	useKeyDownHandler(keyDownCheckboxActions);

	const toggleSaveSymbolInterval = (): void => {
		settingsProviderProxy().saveSymbolIntervalChange.next(!isSaveSymbolIntervalOn);
	};

	const toggleHideTabsInFullScreen = (): void => {
		settingsProviderProxy().macosHideTabsInFullscreenChange.next(!isHideTabsInFullScreenOn);
		settingsProviderProxy().recomputeFullscreenedWindowsBounds(!isHideTabsInFullScreenOn)
			.catch((error) => {
				loggerServiceProxy().error(
					'<TabSettings>.toggleHideTabsInFullScreen: settingsProviderProxy().recomputeFullscreenedWindowsBounds() error',
					error
				);
			});
	};

	return (
		<>
			<SettingsSection label={ t('ON STARTUP') }>
				<Checkbox
					id={ AUTO_RESTORE_CHECKBOX_ID }
					checked={ isSaveSymbolIntervalOn }
					onChange={ toggleSaveSymbolInterval }
					label={ t('Auto-restore tickers and intervals') }
					tabIndex={ 1 }
				/>
			</SettingsSection>

			{ isDarwin() &&
				<SettingsSection label={ t('ON FULLSCREEN') }>
					<Checkbox
						id={ HIDE_TABS_IN_FULL_SCREEN_CHECKBOX_ID }
						checked={ isHideTabsInFullScreenOn }
						onChange={ toggleHideTabsInFullScreen }
						label={ t('Hide tabs in full screen mode') }
						tabIndex={ 1 }
					/>
				</SettingsSection>
			}

			<TabTitleOrderSettings />

			<div className='control-button-wrapper'>
				<SquareButton
					onClick={ setDefaultTabSettings }
					size={ ButtonSize.Small }
					color={ ButtonColor.Gray }
					variant={ ButtonVariant.Secondary }
					tabIndex={ 2 }
					id='resetToDefault'
				>
					{ t('Reset to default') }
				</SquareButton>
			</div>
		</>
	);
};
