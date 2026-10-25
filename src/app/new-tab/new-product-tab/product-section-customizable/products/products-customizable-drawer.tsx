import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, BadgeSize } from '@tradingview/ui-lib/badge';
import { CloseButton } from '@tradingview/ui-lib/buttons/close-button';
import { IconButton, IconButtonShape } from '@tradingview/ui-lib/buttons/icon-button';
import { ButtonSize } from '@tradingview/ui-lib/buttons/nav-button';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconcalendarSize28pxStroke1 as calendarSvgIcon } from '@tradingview/ui-lib/icons/monochrome/calendar/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconcaseSize28pxStroke1 as caseSvgIcon } from '@tradingview/ui-lib/icons/monochrome/case/size_28px__stroke_1.5px__type_for-business__usage_product-icons';
import { svgIconcommunitySize28pxStroke1 as communitySvgIcon } from '@tradingview/ui-lib/icons/monochrome/community/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconfundamentalGraphsSize28pxStroke1 as fundamentalGraphsSvgIcon } from '@tradingview/ui-lib/icons/monochrome/fundamental-graphs/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconglobeSize28pxStroke1 as globeSvgIcon } from '@tradingview/ui-lib/icons/monochrome/globe/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconheatmapSize28pxStroke1 as heatmapSvgIcon } from '@tradingview/ui-lib/icons/monochrome/heatmap/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconnewsSize28pxStroke1 as newsFlowSvgIcon } from '@tradingview/ui-lib/icons/monochrome/news/size_28px__stroke_1.5px__type_news-screener__usage_product-icons';
import { svgIconoptionsSize28pxStroke1 as optionsSvgIcon } from '@tradingview/ui-lib/icons/monochrome/options/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconscreenerSize28pxStroke1 as screenerSvgIcon } from '@tradingview/ui-lib/icons/monochrome/screener/size_28px__stroke_1.5px__usage_product-icons';
import { svgIconstarSize18pxFilledOn as starFillSvgIcon } from '@tradingview/ui-lib/icons/monochrome/star/size_18px__filled_on';
import { svgIconstarSize18pxStroke1px as starOutlineSvgIcon } from '@tradingview/ui-lib/icons/monochrome/star/size_18px__stroke_1px';
import { svgIconyieldCurvesSize28pxStroke1 as yieldCurvesSvgIcon } from '@tradingview/ui-lib/icons/monochrome/yield-curves/size_28px__stroke_1.5px__usage_product-icons';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../../logger';
import { newTabServiceProxy } from '../../../../../services/new-tab';
import { productSectionItemIds, ProductStates } from '../../../../../services/new-tab/inew-tab-service';
import { useFocusLock, useOutsideClick } from '../../../../components-ui/hooks';
import { withPortal } from '../../../hocs';
import { getProductStatesDefault, isProduct, ListItem } from '../products';
// TODO: Change the icon to the monochrome version once ui-lib is updated to 1.4.7
import { macroMapsSvgIcon } from './assets/macro-maps-svg-icon';

import './products-customizable-drawer.css';

interface ProductsCustomizableDrawerProps {
	closeDrawer(): void;
	itemList: (ListItem)[];
	productStates: ProductStates;
	toggleProduct(productToggledId: string): void;
}

function getListItemIcon(id: string): string {
	const listItemIconMap = new Map<string, string>([
		[productSectionItemIds.screener, screenerSvgIcon],
		[productSectionItemIds.heatmap, heatmapSvgIcon],
		[productSectionItemIds.calendars, calendarSvgIcon],
		[productSectionItemIds.newsFlow, newsFlowSvgIcon],
		[productSectionItemIds.portfolios, caseSvgIcon],
		[productSectionItemIds.yieldCurves, yieldCurvesSvgIcon],
		[productSectionItemIds.options, optionsSvgIcon],
		[productSectionItemIds.fundamentalGraphs, fundamentalGraphsSvgIcon],
		[productSectionItemIds.markets, globeSvgIcon],
		[productSectionItemIds.community, communitySvgIcon],
		[productSectionItemIds.macroMaps, macroMapsSvgIcon],
	]);

	return listItemIconMap.get(id) ?? '';
}

function getListItemTitleStyle(listItem: ListItem): 'typography-accent-16px-medium' | 'typography-regular-16px' {
	if (isProduct(listItem) && listItem.section !== null) {
		return 'typography-regular-16px';
	}

	return 'typography-accent-16px-medium';
}

export const ProductsCustomizableDrawer = withPortal(({
	closeDrawer,
	itemList,
	productStates,
	toggleProduct,
}: ProductsCustomizableDrawerProps): JSX.Element => {
	const { t } = useTranslation();

	const ref = useRef<HTMLDivElement>(null);

	useOutsideClick<HTMLDivElement>(
		ref,
		true,
		closeDrawer,
		{ escape: true },
	);

	useFocusLock<HTMLDivElement>(ref);

	useEffect(() => {
		const loadProductStates = async(): Promise<void> => {
			const productStatesStored = await newTabServiceProxy().getProductStates();

			if (Object.keys(productStatesStored).length === 0) {
				const productStatesDefault = getProductStatesDefault(itemList);

				await newTabServiceProxy().setProductStates(productStatesDefault);

				return;
			}

			let shouldUpdateProductStates = false;
			const productStatesUpdated = { ...productStatesStored };

			itemList
				.filter(isProduct)
				.forEach(({ id }) => {
					if (productStatesUpdated[id] === undefined) {
						productStatesUpdated[id] = { isSelected: false };
						shouldUpdateProductStates = true;
					}
				});

			if (shouldUpdateProductStates) {
				await newTabServiceProxy().setProductStates(productStatesUpdated);
			}
		};

		loadProductStates()
			.catch((error) => {
				loggerServiceProxy().error('<ProductsCustomizableDrawer>.useEffect(): loadProductStates() error', error);
			});
	}, [itemList]);

	return (
		<div ref={ ref } className='products-customizable-drawer' tabIndex={ -1 }>
			<header className='products-customizable-drawer-header'>
				<Typography
					tag='h2'
					name='typography-accent-18px-semibold'
					className='products-customizable-drawer-title'
				>
					{ t('Individual tools') }
				</Typography>
				<CloseButton
					aria-label='close-products-customizable-drawer'
					onClick={ closeDrawer }
					size={ ButtonSize.Medium }
					tabIndex={ 1 }
				/>
			</header>
			<ul className='products-customizable-drawer-list'>
				{ itemList.map((item) => {
					const isSelected = isProduct(item)
						? productStates[item.id]?.isSelected ?? false
						: false;

					const listItemClassName = clsx({
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'products-customizable-drawer-list-item': true,
						[item.type]: true,
						'nested': isProduct(item) && item.section !== null,
						'selected': isSelected,
					});

					return (
						<li key={ item.id } className={ listItemClassName }>
							<div className='products-customizable-drawer-list-item-main'>
								<div className='products-customizable-drawer-list-item-icon'>
									<BlockIcon icon={ getListItemIcon(item.id) } />
								</div>
								<Typography
									tag='div'
									name={ getListItemTitleStyle(item) }
									className='products-customizable-drawer-list-item-title'
								>
									{ item.title }
								</Typography>
								{ item.isBeta && <Badge size={ BadgeSize.Small } className='products-customizable-drawer-list-item-badge beta'>beta</Badge> }
								{ item.isNew && <Badge size={ BadgeSize.Small } className='products-customizable-drawer-list-item-badge new'>new</Badge> }
							</div>
							{ isProduct(item) &&
								<div className='products-customizable-drawer-list-item-end-adornment'>
									<Typography
										tag='span'
										name='typography-regular-13px'
										className='products-customizable-drawer-list-item-hotkey'
									>
										{ item.hotkey.join(' + ') }
									</Typography>
									<IconButton
										isToggled={ isSelected }
										onToggle={ () => { toggleProduct(item.id); } }
										toggledIcon={ starFillSvgIcon }
										toggledTitle={ t('Remove from favorites') }
										toggledColorClassName='products-customizable-drawer-list-item-favorite-button-toggled'
										untoggledIcon={ starOutlineSvgIcon }
										untoggledTitle={ t('Add to favorites') }
										untoggledColorClassName='products-customizable-drawer-list-item-favorite-button-untoggled'
										shape={ IconButtonShape.Square }
										variant='primary'
									/>
								</div>
							}
						</li>
					);
				}) }
			</ul>
		</div>
	);
});
