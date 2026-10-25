import { TFunction } from 'i18next';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { svgIconvolumeSize28pxStroke1pxTypeMute as muteSvgIcon } from '@tradingview/ui-lib/icons/monochrome/volume/size_28px__stroke_1px__type_mute';
import { svgIconvolumeSize28pxStroke1pxTypeOneWave as oneWaveSvgIcon } from '@tradingview/ui-lib/icons/monochrome/volume/size_28px__stroke_1px__type_one-wave';
import { svgIconvolumeSize28pxStroke1pxTypeTwoWaves as twoWavesSvgIcon } from '@tradingview/ui-lib/icons/monochrome/volume/size_28px__stroke_1px__type_two-waves';
// TODO: fix import after DRG-2084
import { Slider } from '@tradingview/ui-lib/slider/slider/slider';
import { TooltipStateless } from '@tradingview/ui-lib/tooltip/tooltip-stateless/tooltip-stateless';

import { soundPlayerServiceProxy } from '../../../../../services/browser-api';
import { settingsProviderProxy } from '../../../../../services/settings';
import { isRtlHelper } from '../../../../../utils';
import { useObservable } from '../../../../components-ui/hooks';
import { Icon } from '../../../../components-ui/icon';

import './alert-volume-slider.css';

function getVolumeIcon(volume: number): string {
	if (volume === 0) {
		return muteSvgIcon;
	}

	if (volume === 100) {
		return twoWavesSvgIcon;
	}

	return oneWaveSvgIcon;
}

function getTooltipAnchorClass(volume: number): string {
	if (volume === 0) {
		return 'min';
	}

	if (volume === 100) {
		return 'max';
	}

	return '';
}

function getTooltipContent(volume: number, t: TFunction): string {
	if (volume === 0) {
		return t('No alarms and no surprises, please');
	}

	if (volume === 100) {
		return t('Max volume, it might be loud');
	}

	return '';
}

const defaultVolumeLevel = 50;

export const AlertVolumeSlider = (): JSX.Element => {
	const { t, i18n } = useTranslation();

	const tooltipAnchorRef = useRef<HTMLDivElement>(null);

	const [volume, setVolume] = useState<number>(defaultVolumeLevel);
	const [isSliderContainerHovered, setIsSliderContainerHovered] = useState<boolean>(false);

	useObservable<number>(settingsProviderProxy().alertVolumeChange, setVolume);

	const handleVolumeChange = (value: number): void => {
		settingsProviderProxy().alertVolumeChange.next(value);
		soundPlayerServiceProxy().playSound({
			volume: value,
			duration: 0,
			name: 'alert/fired',
		});
	};

	return (
		<div className='alert-volume-slider'>
			<Icon icon={ getVolumeIcon(volume) } />

			<div
				className='slider-container'
				onMouseEnter={ () => { setIsSliderContainerHovered(true); } }
				onMouseLeave={ () => { setIsSliderContainerHovered(false); } }
			>
				<Slider
					min={ 0 }
					max={ 100 }
					rtl={ isRtlHelper(i18n.language) }
					value={ volume }
					onChange={ setVolume }
					onCommit={ handleVolumeChange }
					ariaLabel='alert-volume-slider'
				/>

				<div
					ref={ tooltipAnchorRef }
					className={ `alert-volume-tooltip-anchor ${ getTooltipAnchorClass(volume) }` }
				/>
				<TooltipStateless
					id='alert-volume-tooltip'
					open={ (volume === 0 || volume === 100) && isSliderContainerHovered }
					onClose={ () => {} }
					content={ getTooltipContent(volume, t) }
					anchor={ tooltipAnchorRef }
				/>
			</div>
		</div>
	);
};
