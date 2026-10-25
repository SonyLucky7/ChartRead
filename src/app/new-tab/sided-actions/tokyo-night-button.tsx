import { TFunction } from 'i18next';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIcontradingviewLogoSize28pxStroke1 as tvLogoSvgIcon } from '@tradingview/ui-lib/icons/monochrome/tradingview-logo/size_28px__stroke_1.5px__usage_product-icons';
import { TooltipPlacements } from '@tradingview/ui-lib/tooltip';
import { TooltipStateless } from '@tradingview/ui-lib/tooltip/tooltip-stateless/tooltip-stateless';

import { loggerServiceProxy } from '../../../logger';
import { settingsProviderProxy } from '../../../services/settings';
import { useObservable, useTheme, useTokyoNight } from '../../components-ui/hooks';
import { tvLogoSvgIconActive } from './tokyo-night-button/tv-logos-active';

import './tokyo-night-button.css';

function getTooltipText(isDarkTheme: boolean, isTokyoOn: boolean, t: TFunction): string {
	if (!isDarkTheme) {
		return t('Switch to dark theme and click here');
	}

	return isTokyoOn ? t('Turn off Tokyo Night') : t('Turn on Tokyo Night');
}

export const TokyoNightButton = (): JSX.Element => {
	const { t } = useTranslation();

	const tokyoNightButtonRef = useRef<HTMLButtonElement>(null);

	const [isHardwareAccelerationDisabled, setIsHardwareAccelerationDisabled] = useState<boolean>(false);
	const [isTooltipShown, setIsTooltipShown] = useState<boolean>(false);

	const { isDarkTheme } = useTheme();

	const { isTokyoNightOn, toggleTokyoNight } = useTokyoNight();

	useObservable(settingsProviderProxy().hardwareAccelerationChange, setIsHardwareAccelerationDisabled);

	const onClick = (): void => {
		if (!isDarkTheme) {
			return;
		}

		loggerServiceProxy().info(
			`<TokyoNightButton>.onClick(): TokyoNight theme is being toggled ${ !isTokyoNightOn ? 'on' : 'off' }`
		);

		toggleTokyoNight();
		setIsTooltipShown(false);
	};

	return (
		<>
			<button
				onClick={ onClick }
				className='sided-action-button tokyo-night-button'
				disabled={ isHardwareAccelerationDisabled }
				ref={ tokyoNightButtonRef }
				onMouseEnter={ () => { setIsTooltipShown(true); } }
				onMouseLeave={ () => { setIsTooltipShown(false); } }
			>
				<BlockIcon
					icon={ isTokyoNightOn ? tvLogoSvgIconActive : tvLogoSvgIcon }
					className='tokyo-night-button-logo'
				/>
			</button>

			<TooltipStateless
				id='tokyo-night-tooltip'
				open={ isTooltipShown }
				onClose={ () => {} }
				content={ getTooltipText(isDarkTheme, isTokyoNightOn, t) }
				anchor={ tokyoNightButtonRef }
				placement={ TooltipPlacements.Right }
			/>
		</>
	);
};
