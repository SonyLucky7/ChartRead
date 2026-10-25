import React, { useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { minusSvgIcon } from '@tradingview/ui-lib/icons/18px-1/math/minus';
import { plusSvgIcon } from '@tradingview/ui-lib/icons/18px-1/math/plus';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../logger';
import { mainMenuServiceProxy } from '../../../../services/main-menu-service';
import { isWin32 } from '../../../../utils';
import { getArrowKeyboardNavigationDataAttributes } from '../../../common/arrow-keyboard-navigation-data-attributes';

import './zoom-item.css';

interface ZoomItemProps {
	zoom: number;
	title: string;
	icon: JSX.Element;
}

const updateZoomValue = (prevValue: number, newValue: number, isZoomIn: boolean): number => {
	const formattedNewZoomValue = Math.round(newValue * 100);

	const isNewZoomCorrect = isZoomIn ? formattedNewZoomValue > prevValue : formattedNewZoomValue < prevValue;

	if (!isNewZoomCorrect) {
		return prevValue;
	}

	return formattedNewZoomValue;
};

export const ZoomItem = ({ icon, title, zoom: initialZoom }: ZoomItemProps): JSX.Element => {
	const [zoom, setZoom] = useState<number>(initialZoom);

	const zoomChange = async(isZoomIn: boolean): Promise<void> => {
		try {
			const newZoom = isZoomIn
				? await mainMenuServiceProxy().increaseZoom()
				: await mainMenuServiceProxy().decreaseZoom();

			if (!newZoom) {
				return;
			}

			setZoom((prevValue) => updateZoomValue(prevValue, newZoom, isZoomIn));
		}
		catch (error) {
			loggerServiceProxy().error('<ZoomItem>.zoomChange(): mainMenuServiceProxy().increaseZoom()/decreaseZoom()', error);
		}
	};

	return (
		<div className='zoom-container'>
			<div className='zoom-icon'>
				{ icon }
			</div>

			<div className='zoom-title'>
				{ title }
			</div>
			<div className='zoom-buttons'>
				<SquareButton
					{ ...getArrowKeyboardNavigationDataAttributes(true) }
					variant={ ButtonVariant.Primary }
					size={ ButtonSize.XSmall }
					color={ ButtonColor.Gray }
					iconOnly
					startSlot={ <BlockIcon icon={ minusSvgIcon } /> }
					onClick={ () => { void zoomChange(false); } }
				/>
				<Typography name='typography-regular-14px' tag='div' className={ `zoom-value ${ isWin32() ? 'win32' : 'other' }` }>
					{ zoom }%
				</Typography>

				<SquareButton
					{ ...getArrowKeyboardNavigationDataAttributes(true) }
					variant={ ButtonVariant.Primary }
					size={ ButtonSize.XSmall }
					color={ ButtonColor.Gray }
					iconOnly
					startSlot={ <BlockIcon icon={ plusSvgIcon } /> }
					onClick={ () => { void zoomChange(true); } }
				/>

			</div>
		</div>
	);
};
