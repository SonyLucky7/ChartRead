import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIcontuneSize28pxStroke1px as tuneSvgIcon } from '@tradingview/ui-lib/icons/monochrome/tune/size_28px__stroke_1px';
import { TooltipPlacements } from '@tradingview/ui-lib/tooltip';
import { TooltipStateless } from '@tradingview/ui-lib/tooltip/tooltip-stateless/tooltip-stateless';

import { loggerServiceProxy } from '../../../logger';
import { newTabServiceProxy } from '../../../services/new-tab';
import { HintReferenceable, HintReferenceablePosition } from '../../components-ui/hint-referenceable/hint-referenceable';
import { getItemList, isProduct } from '../new-product-tab/product-section-customizable/products';

import './product-drawer-button.css';

interface ProductDrawerButtonProps {
	onClick(): void;
	isHintShown: boolean;
	onHintClose(): void;
}

export const ProductDrawerButton = ({ onClick, isHintShown, onHintClose }: ProductDrawerButtonProps): JSX.Element => {
	const { t } = useTranslation();

	const productDrawerButtonRef = React.useRef<HTMLButtonElement>(null);

	const [isTooltipShown, setIsTooltipShown] = useState<boolean>(false);
	const [isProductListUpdated, setIsProductListUpdated] = useState<boolean>(false);

	useEffect(() => {
		const checkIsProductListUpdated = async(): Promise<void> => {
			const productStates = await newTabServiceProxy().getProductStates();

			if (Object.keys(productStates).length === 0) {
				setIsProductListUpdated(true);
				return;
			}

			const itemList = await getItemList(t);

			itemList
				.filter(isProduct)
				.forEach((item) => {
					if (productStates[item.id] === undefined) {
						setIsProductListUpdated(true);
						return;
					}
				});
		};

		checkIsProductListUpdated()
			.catch((error) => {
				loggerServiceProxy().error('<ProductDrawerButton>.useEffect(): checkIsProductListUpdated() error', error);
			});
	}, [t]);

	const handleMenuClick = (): void => {
		onHintClose();
		onClick();

		setIsTooltipShown(false);
		setIsProductListUpdated(false);
	};

	return (
		<>
			<HintReferenceable
				onAccept={ onHintClose }
				isShown={ isHintShown }
				text={ t('Make your workspace yours. Keep only the tools you need.') }
				position={ HintReferenceablePosition.Left }
				className='product-drawer-button-hint'
			>
				<button
					onClick={ handleMenuClick }
					className='sided-action-button product-drawer-button'
					ref={ productDrawerButtonRef }
					onMouseEnter={ () => { setIsTooltipShown(true); } }
					onMouseLeave={ () => { setIsTooltipShown(false); } }
				>
					<BlockIcon icon={ tuneSvgIcon } />
					{ isProductListUpdated && <div className='product-drawer-button-products-updated-indicator' /> }
				</button>
			</HintReferenceable>

			<TooltipStateless
				id='product-drawer-button-tooltip'
				open={ isTooltipShown }
				onClose={ () => {} }
				content={ t('Individual tools') }
				anchor={ productDrawerButtonRef }
				placement={ TooltipPlacements.Left }
			/>
		</>
	);
};
