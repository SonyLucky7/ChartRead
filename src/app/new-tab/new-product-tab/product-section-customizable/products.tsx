import { TFunction } from 'i18next';
import React, { Ref, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loggerServiceProxy } from '../../../../logger';
import { MouseButton } from '../../../../native/hardware';
import { newTabServiceProxy } from '../../../../services/new-tab';
import { ProductId, productSectionItemIds, ProductStates, SectionId } from '../../../../services/new-tab/inew-tab-service';
import { urlPathnames } from '../../../../services/window/tab/tab-title-api';
import { RendererServiceData } from '../../../../services/window/window-api';
import { featureServiceProxy } from '../../../../tv-services/feature';
import { SunsetCandidateProduct } from '../../../../tv-services/feature/ifeature-service';
import { getRendererInitialData, getWindowControl } from '../../../common/app-common';
import { useHotkeys, useTVHost } from '../../../components-ui/hooks';
import { BLOCKS_HOTKEYS_ATTRIBUTE } from '../../../components-ui/hooks/use-hotkeys';
import { MODAL_WINDOW_CLASSNAME } from '../../../components-ui/modal-window/modal-window';
import { Spinner } from '../../../spinner/spinner';
import { isOpenPageInNewTab, NewTabCallbackRef } from '../../new-product-tab';
import { ProductMenuContext } from '../product-section-customizable';
import { NoProductSelected } from './products/no-product-selected';
import { Product } from './products/product';
import { ProductsCustomizableDrawer } from './products/products-customizable-drawer';

interface ProductsProps {
	callbackRef: Ref<NewTabCallbackRef>;
}

export const enum ListItemType {
	Section = 'section',
	Default = 'default',
}

export interface ListItem {
	id: SectionId | ProductId;
	type: ListItemType;
	title: string;
	isBeta: boolean;
	isNew: boolean;
}

export interface ProductSection extends ListItem {
	id: SectionId;
	type: ListItemType.Section;
}

export interface Product extends ListItem {
	id: ProductId;
	type: ListItemType.Default;
	hotkey: string[];
	section: ProductSection | null;
	url: string;
}

export interface HandleProductContextMenuClickOptions {
	title: string | [string, string];
	urlPathname: string;
}

export const isProduct = (value: ListItem): value is Product => value.type === ListItemType.Default;

function getFullItemList(t: TFunction): ListItem[] {
	const screenerSection: ProductSection = {
		id: productSectionItemIds.screener,
		type: ListItemType.Section,
		title: t('Screeners'),
		isBeta: false,
		isNew: false,
	};

	const screenerStocks: Product = {
		id: productSectionItemIds.screenerStocks,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('Stocks'),
		hotkey: ['s', 'a'],
		url: urlPathnames.stockScreener,
		isBeta: false,
		isNew: false,
	};

	const screenerEtf: Product = {
		id: productSectionItemIds.screenerEtf,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('ETFs'),
		hotkey: ['s', 'e'],
		url: urlPathnames.etfScreener,
		isBeta: false,
		isNew: false,
	};

	const screenerBonds: Product = {
		id: productSectionItemIds.screenerBonds,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('Bonds'),
		hotkey: ['s', 'b'],
		url: urlPathnames.bonds,
		isBeta: false,
		isNew: false,
	};

	const screenerCrypto: Product = {
		id: productSectionItemIds.screenerCrypto,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('Crypto coins'),
		hotkey: ['s', 'c'],
		url: urlPathnames.cryptoCoins,
		isBeta: false,
		isNew: false,
	};

	const screenerCexPairs: Product = {
		id: productSectionItemIds.screenerCexPairs,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('CEX pairs'),
		hotkey: ['s', 'x'],
		url: urlPathnames.cexScreener,
		isBeta: false,
		isNew: false,
	};

	const screenerDexPairs: Product = {
		id: productSectionItemIds.screenerDexPairs,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('DEX pairs'),
		hotkey: ['s', 'd'],
		url: urlPathnames.dexScreener,
		isBeta: false,
		isNew: false,
	};

	const screenerPine: Product = {
		id: productSectionItemIds.screenerPine,
		type: ListItemType.Default,
		section: screenerSection,
		title: t('Pine'),
		hotkey: ['s', 'p'],
		url: urlPathnames.pineScreener,
		isBeta: true,
		isNew: false,
	};

	const heatmapSection: ProductSection = {
		id: productSectionItemIds.heatmap,
		type: ListItemType.Section,
		title: t('Heatmaps'),
		isBeta: false,
		isNew: false,
	};

	const heatmapStocks: Product = {
		id: productSectionItemIds.heatmapStocks,
		type: ListItemType.Default,
		section: heatmapSection,
		title: t('Stocks'),
		hotkey: ['h', 's'],
		url: urlPathnames.stockHeatmap,
		isBeta: false,
		isNew: false,
	};

	const heatmapEtf: Product = {
		id: productSectionItemIds.heatmapEtf,
		type: ListItemType.Default,
		section: heatmapSection,
		title: t('ETFs'),
		hotkey: ['h', 'e'],
		url: urlPathnames.etfHeatmap,
		isBeta: false,
		isNew: false,
	};

	const heatmapCrypto: Product = {
		id: productSectionItemIds.heatmapCrypto,
		type: ListItemType.Default,
		section: heatmapSection,
		title: t('Crypto'),
		hotkey: ['h', 'c'],
		url: urlPathnames.cryptoHeatmap,
		isBeta: false,
		isNew: false,
	};

	const calendars: Product = {
		id: productSectionItemIds.calendars,
		type: ListItemType.Default,
		section: null,
		title: t('Calendars'),
		hotkey: ['e'],
		url: urlPathnames.economicCalendar,
		isBeta: false,
		isNew: false,
	};

	const communitySection: ProductSection = {
		id: productSectionItemIds.community,
		type: ListItemType.Section,
		title: t('Community'),
		isBeta: false,
		isNew: false,
	};

	const newsFlow: Product = {
		id: productSectionItemIds.newsFlow,
		type: ListItemType.Default,
		section: null,
		title: t('News Flow'),
		hotkey: ['n'],
		url: urlPathnames.newsFlow,
		isBeta: false,
		isNew: false,
	};

	const portfolios: Product = {
		id: productSectionItemIds.portfolios,
		type: ListItemType.Default,
		section: null,
		title: t('Portfolios'),
		hotkey: ['p'],
		url: urlPathnames.portfolios,
		isBeta: false,
		isNew: false,
	};

	const yieldCurves: Product = {
		id: productSectionItemIds.yieldCurves,
		type: ListItemType.Default,
		section: null,
		title: t('Yield Curves'),
		hotkey: ['y'],
		url: urlPathnames.yieldCurves,
		isBeta: false,
		isNew: false,
	};

	const options: Product = {
		id: productSectionItemIds.options,
		type: ListItemType.Default,
		section: null,
		title: t('Options'),
		hotkey: ['o'],
		url: urlPathnames.options,
		isBeta: false,
		isNew: false,
	};

	const fundamentalGraphs: Product = {
		id: productSectionItemIds.fundamentalGraphs,
		type: ListItemType.Default,
		section: null,
		title: t('Fundamental Graphs'),
		hotkey: ['f'],
		url: urlPathnames.fundamentalGraphs,
		isBeta: false,
		isNew: false,
	};

	const markets: Product = {
		id: productSectionItemIds.markets,
		type: ListItemType.Default,
		section: null,
		title: t('Markets'),
		hotkey: ['m'],
		url: urlPathnames.markets,
		isBeta: false,
		isNew: false,
	};

	const communityIndicators: Product = {
		id: productSectionItemIds.communityIndicators,
		type: ListItemType.Default,
		section: communitySection,
		title: t('Indicators'),
		hotkey: ['c', 'i'],
		url: urlPathnames.communityIndicators,
		isBeta: false,
		isNew: false,
	};

	const communityTradingIdeas: Product = {
		id: productSectionItemIds.communityTradingIdeas,
		type: ListItemType.Default,
		section: communitySection,
		title: t('Trading ideas'),
		hotkey: ['c', 't'],
		url: urlPathnames.communityTradingIdeas,
		isBeta: false,
		isNew: false,
	};

	const macroMaps: Product = {
		id: productSectionItemIds.macroMaps,
		type: ListItemType.Default,
		section: null,
		title: t('Macro Maps'),
		hotkey: ['a'],
		url: urlPathnames.macroMaps,
		isBeta: false,
		isNew: false,
	};

	return [
		screenerSection,
		screenerStocks,
		screenerEtf,
		screenerBonds,
		screenerCrypto,
		screenerCexPairs,
		screenerDexPairs,
		screenerPine,
		heatmapSection,
		heatmapStocks,
		heatmapEtf,
		heatmapCrypto,
		calendars,
		newsFlow,
		portfolios,
		yieldCurves,
		options,
		fundamentalGraphs,
		markets,
		communitySection,
		communityIndicators,
		communityTradingIdeas,
		macroMaps,
	];
}

function getDefaultFavoriteProductsIds(itemList: ListItem[]): string[] {
	return itemList
		.filter(isProduct)
		.map((item) => item.id)
		.filter((id) => {
			if (id.startsWith(productSectionItemIds.screener)) {
				return id === productSectionItemIds.screenerStocks;
			}

			if (id.startsWith(productSectionItemIds.heatmap)) {
				return id === productSectionItemIds.heatmapStocks;
			}

			if (id.startsWith(productSectionItemIds.community)) {
				return id === productSectionItemIds.communityIndicators;
			}

			return true;
		});
}

async function getHiddenProductIds(): Promise<ProductId[]> {
	const hiddenProductIds: ProductId[] = [];

	const newsFlowHidden = await featureServiceProxy().isFeatureEnabled(SunsetCandidateProduct.NEWS_FLOW, false)
		.catch((error) => {
			loggerServiceProxy().error(`getHiddenProductIds(): featureServiceProxy().isFeatureEnabled(key: ${ SunsetCandidateProduct.NEWS_FLOW }) error`, error);

			return false;
		});

	if (newsFlowHidden) {
		hiddenProductIds.push(productSectionItemIds.newsFlow);
	}

	const fundamentalGraphsHidden = await featureServiceProxy().isFeatureEnabled(SunsetCandidateProduct.FUNDAMENTAL_GRAPHS, false)
		.catch((error) => {
			loggerServiceProxy().error(`getHiddenProductIds(): featureServiceProxy().isFeatureEnabled(key: ${ SunsetCandidateProduct.FUNDAMENTAL_GRAPHS }) error`, error);

			return false;
		});

	if (fundamentalGraphsHidden) {
		hiddenProductIds.push(productSectionItemIds.fundamentalGraphs);
	}

	return hiddenProductIds;
}

export async function getItemList(t: TFunction): Promise<ListItem[]> {
	const hiddenProductIds = await getHiddenProductIds();

	return getFullItemList(t).filter((item) => !isProduct(item) || !hiddenProductIds.includes(item.id));
}

export function getProductStatesDefault(itemList: ListItem[]): ProductStates {
	const productStatesDefault: ProductStates = {};
	const defaultFavoriteProductsIds = getDefaultFavoriteProductsIds(itemList);

	itemList
		.filter(isProduct)
		.forEach(({ id }) => {
			productStatesDefault[id] = {
				isSelected: defaultFavoriteProductsIds.includes(id),
			};
		});

	return productStatesDefault;
}

export const Products = ({ callbackRef }: ProductsProps): JSX.Element => {
	const { t } = useTranslation();

	const { setContextMenuData, pushContextMenuContainer, popContextMenuContainers } = useContext(ProductMenuContext);

	const productsRef = useRef<HTMLDivElement>(null);

	const { constructURLWithTVHost } = useTVHost();

	const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);

	const [itemList, setItemList] = useState<(ListItem)[]>([]);
	const [productStates, setProductStates] = useState<ProductStates>({});

	useImperativeHandle(callbackRef, () => ({
		openDrawer: (): void => {
			setIsDrawerOpened(true);
		},
	}));

	useEffect(() => {
		const loadItemList = async(): Promise<void> => {
			const itemListInitial = await getItemList(t);

			setItemList(itemListInitial);

			const states = await newTabServiceProxy().getProductStates();

			if (Object.keys(states).length === 0) {
				setProductStates(getProductStatesDefault(itemListInitial));

				return;
			}

			setProductStates(states);
		};

		loadItemList()
			.catch((error) => {
				loggerServiceProxy().error('<Products>.useEffect(): loadItemList() error', error);
			});
	}, [t]);

	useEffect(() => {
		pushContextMenuContainer?.(productsRef);

		return () => {
			popContextMenuContainers?.();
		};
	}, [popContextMenuContainers, pushContextMenuContainer]);

	const productsSelected = itemList
		.filter(isProduct)
		.filter(({ id }) => productStates[id]?.isSelected ?? false);

	useHotkeys({
		hotkeyCallbacks: productsSelected.map(({ hotkey, url }) => ({
			hotkey,
			cb: () => {
				const productUrl = constructURLWithTVHost(url);

				newTabServiceProxy().loadURL({
					url: productUrl,
					tabId: getRendererInitialData<RendererServiceData>().tabId,
				})
					.catch((error) => {
						loggerServiceProxy().error(
							`<Products>.useHotkeys(): newTabServiceProxy().loadURL(url: ${ productUrl }) error`,
							error,
						);
					});
			},
		})),
		isEnabled: () =>
			!isDrawerOpened &&
			document.querySelector(`.${ MODAL_WINDOW_CLASSNAME }`) === null &&
			document.querySelector(`[${ BLOCKS_HOTKEYS_ATTRIBUTE }]`) === null,
	});

	const toggleProduct = (productToggledId: ProductId): void => {
		setProductStates((prevState) => {
			const newState = { ...prevState };

			if (newState[productToggledId] === undefined) {
				newState[productToggledId] = { isSelected: true };
			}
			else {
				newState[productToggledId] = {
					...newState[productToggledId],
					isSelected: !newState[productToggledId].isSelected,
				};
			}

			newTabServiceProxy().setProductStates(newState)
				.catch((error) => {
					loggerServiceProxy().error('<Products>.toggleProduct(): newTabServiceProxy().setProductStates() error', error);
				});

			return newState;
		});
	};

	const handleProductClick = (
		ev: React.MouseEvent<HTMLLIElement>,
		urlPathname: string,
	): void => {
		if (![MouseButton.Left, MouseButton.Middle].includes(ev.button)) {
			return;
		}

		const shouldOpenInNewTab = isOpenPageInNewTab(ev);

		const url = constructURLWithTVHost(urlPathname);

		newTabServiceProxy().loadURL(
			{
				url,
				isCtrlKeyPressed: shouldOpenInNewTab,
				tabId: getRendererInitialData<RendererServiceData>().tabId,
			},
			shouldOpenInNewTab
		)
			.catch((error) => {
				loggerServiceProxy().error(
					`<ProductSectionCustomizable>.handleProductClick(): newTabServiceProxy().loadURL(url: ${ url }) error`,
					error,
				);
			});
	};

	const handleProductContextMenuClick = (
		{ clientX, clientY }: React.MouseEvent<HTMLLIElement>,
		{ title, urlPathname }: HandleProductContextMenuClickOptions
	): void => {
		setContextMenuData?.({
			isOpened: true,
			position: { x: clientX, y: clientY },
			title: Array.isArray(title) ? title[1] : title,
			url: constructURLWithTVHost(urlPathname),
		});

		getWindowControl().triggerMenuCloseEvent('context-menu')
			.catch((error) => {
				loggerServiceProxy().error('<Product>.handleContextMenu(): getWindowControl().triggerMenuCloseEvent()', error);
			});
	};

	return (
		<>
			<section className='products-customizable' ref={ productsRef }>
				{ /* saves from flashing no product selected component when it is actually just itemList is not yet initialised */ }
				{ itemList.length === 0 || Object.keys(productStates).length === 0
					? <Spinner />
					: productsSelected.length > 0
						? <ul className='products-customizable-list'>
							{ productsSelected.map((product) =>
								<Product
									key={ product.id }
									id={ product.id }
									onClick={ handleProductClick }
									onContextMenu={ handleProductContextMenuClick }
									title={
										product.section === null
											? product.title
											: [product.section.title, product.title]
									}
									urlPathname={ product.url }
									isBeta={ product.isBeta }
									isNew={ product.isNew }
								/>
							) }
						</ul>
						: <NoProductSelected onClick={ () => { setIsDrawerOpened(true); } } />
				}
			</section>

			<ProductsCustomizableDrawer
				isOpened={ isDrawerOpened }
				closeDrawer={ () => { setIsDrawerOpened(false); } }
				itemList={ itemList }
				productStates={ productStates }
				toggleProduct={ toggleProduct }
			/>
		</>
	);
};
