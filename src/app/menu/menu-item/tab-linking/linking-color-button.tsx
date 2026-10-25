import React, { useState } from 'react';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconcheckSize18pxStroke1 } from '@tradingview/ui-lib/icons/monochrome/check/size_18px__stroke_1.5px__type_stroke';
import { svgIconcrossWebSize18pxStroke1 } from '@tradingview/ui-lib/icons/monochrome/cross-web/size_18px__stroke_1.5px';

import { getArrowKeyboardNavigationDataAttributes } from '../../../common/arrow-keyboard-navigation-data-attributes';
import { LinkColor, linkPallette } from '../../../common/linking-colors';

import './linking-color-button.css';

interface LinkingColorButtonProps {
	color: LinkColor;
	isActive: boolean;
	onClick(): void;
}

export const LinkingColorButton = ({ color, isActive, onClick }: LinkingColorButtonProps): JSX.Element => {
	const [isHovered, setIsHovered] = useState<boolean>(false);

	const buttonStyles = linkPallette.get(color);

	if (buttonStyles === undefined) {
		return <></>;
	}

	return (
		<li>
			<button
				{ ...getArrowKeyboardNavigationDataAttributes(true) }
				onClick={ onClick }
				className='linking-color-button'
				style={ buttonStyles }
				onMouseEnter={ () => { setIsHovered(true); } }
				onMouseLeave={ () => { setIsHovered(false); } }
			>
				{ isActive
					? <BlockIcon
						icon={ isHovered ? svgIconcrossWebSize18pxStroke1 : svgIconcheckSize18pxStroke1 }
						className='linking-color-button-icon'
					/>
					: <></>
				}
			</button>
		</li>
	);
};
