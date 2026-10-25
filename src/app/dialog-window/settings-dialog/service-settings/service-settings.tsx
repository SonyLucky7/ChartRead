import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { app } from '@electron/remote';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Checkbox } from '@tradingview/ui-lib/checkbox';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerService } from '../../../../logger';
import { settingsProviderProxy } from '../../../../services/settings';
import { useObservable } from '../../../components-ui/hooks';
import { SettingsSection } from '../settings-section';
import { useKeyDownHandler } from '../use-keydown-handler';

import './service-settings.css';

export interface ServiceSettingsProps {
	setWarningText: Dispatch<SetStateAction<string | null>>;
	setWarningCallback: Dispatch<SetStateAction<(() => void) | null>>;
	setIsLoaderShowing: Dispatch<SetStateAction<boolean>>;
}

export const HARDWARE_ACCELERATION_CHECKBOX_ID = 'disableHardwareAcceleration';
export const CLEAR_CACHE_BUTTON_ID = 'clearCacheAndCookies';
export const FACTORY_RESET_BUTTON_ID = 'factoryReset';

export const ServiceSettings = ({ setWarningText, setWarningCallback, setIsLoaderShowing }: ServiceSettingsProps): JSX.Element => {
	const { t } = useTranslation();

	const [isHardwareAccelerationOn, setIsHardwareAccelerationOn] = useState<boolean>(false);

	useObservable<boolean>(settingsProviderProxy().hardwareAccelerationChange, setIsHardwareAccelerationOn);

	const relaunchApp = (): void => {
		setIsLoaderShowing(true);

		app.relaunch();
		app.quit();
	};

	const toggleDisableHardwareAcceleration = useCallback((): void => {
		settingsProviderProxy().hardwareAccelerationChange.next(!isHardwareAccelerationOn);

		setWarningText(t('Relaunch for changes to take effect'));

		setWarningCallback(() => relaunchApp);
	/**
	 * the following disable is required because t dependency, if passed,
	 * will create loop which will result in memory leak
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isHardwareAccelerationOn, setWarningCallback, setWarningText]);

	const handleClearAppCacheAndCookies = (): void => {
		settingsProviderProxy().clearAppCacheAndCookies()
			.catch((error) => {
				loggerService().error(
					'<ServiceSettings>.handleClearAppCacheAndCookies(): settingsProviderProxy().clearAppCacheAndCookies() error',
					error,
				);
			});

		setWarningText(t('Relaunch for changes to take effect'));

		setWarningCallback(() => relaunchApp);
	};

	const handleFactoryReset = (): void => {
		setWarningText(t('Relaunch for changes to take effect'));

		setWarningCallback(() => () => {
			settingsProviderProxy().factoryReset()
				.catch((error) => {
					loggerService().error(
						'<ServiceSettings>.handleFactoryReset(): settingsProviderProxy().factoryReset() error',
						error,
					);
				});

			relaunchApp();
		});
	};

	const keyDownCheckboxActions: Record<string, (value: boolean) => void> = useMemo(() => ({
		[HARDWARE_ACCELERATION_CHECKBOX_ID]: toggleDisableHardwareAcceleration,
	}), [toggleDisableHardwareAcceleration]);

	useKeyDownHandler(keyDownCheckboxActions);

	return (
		<>
			<SettingsSection label={ t('PERFORMANCE') }>
				<Checkbox
					id={ HARDWARE_ACCELERATION_CHECKBOX_ID }
					checked={ isHardwareAccelerationOn }
					onChange={ toggleDisableHardwareAcceleration }
					label={ t('Disable hardware acceleration') }
				/>
			</SettingsSection>

			<SettingsSection label={ t('APP DATA') }>
				<div className='service-action-container'>
					<Typography tag='label' name='typography-regular-14px'>
						{ t('App cache') }
					</Typography>

					<SquareButton
						onClick={ handleClearAppCacheAndCookies }
						size={ ButtonSize.XSmall }
						color={ ButtonColor.Gray }
						variant={ ButtonVariant.Secondary }
						id={ CLEAR_CACHE_BUTTON_ID }
					>
						{ t('Clear cache') }
					</SquareButton>
				</div>

				<div className='service-action-container'>
					<Typography tag='label' name='typography-regular-14px'>
						{ t('Factory reset') }
					</Typography>

					<SquareButton
						onClick={ handleFactoryReset }
						size={ ButtonSize.XSmall }
						color={ ButtonColor.Gray }
						variant={ ButtonVariant.Secondary }
						id={ FACTORY_RESET_BUTTON_ID }
					>
						{ t('Back to defaults') }
					</SquareButton>
				</div>
			</SettingsSection>
		</>
	);
};
