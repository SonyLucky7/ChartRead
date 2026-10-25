import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, TextButton } from '@tradingview/ui-lib/buttons/text-button';
import { svgIconkebabMenuSize18pxFilledOn as kebabMenuSvgIcon } from '@tradingview/ui-lib/icons/monochrome/kebab-menu/size_18px__filled_on';
import { svgIconstarSize18pxFilledOn as starFillSvgIcon } from '@tradingview/ui-lib/icons/monochrome/star/size_18px__filled_on';
import { svgIconstarSize18pxStroke1px as starOutlineSvgIcon } from '@tradingview/ui-lib/icons/monochrome/star/size_18px__stroke_1px';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../../../logger';
import { MouseButton } from '../../../../../../native/hardware';
import { localeServiceProxy } from '../../../../../../services/locale';
import { ChartItemExtended, newTabServiceProxy } from '../../../../../../services/new-tab';
import { RendererServiceData } from '../../../../../../services/window/window-api';
import { getRendererInitialData, getWindowControl } from '../../../../../common/app-common';
import { useObservable, useTVHost } from '../../../../../components-ui/hooks';
import { isOpenPageInNewTab, preventScrollOnMiddleClick } from '../../../../new-product-tab';
import { LayoutMenuContext } from '../../layout-section';

import './layout.css';

interface LayoutProps extends Omit<ChartItemExtended, 'description'> {
	displayTitle: React.ReactNode;
	description: React.ReactNode;
	onFavouriteClick(id: number, isFavorite: boolean): void;
}

const CONTEXT_MENU_BY_BUTTON_X_OFFSET = 4;
const CONTEXT_MENU_BY_BUTTON_Y_OFFSET = 22;

// https://www.unicode.org/charts/nameslist/n_0080.html#2022
const bulletChar = '\u2022';

function getLayoutLastModified(timestamp: number, locale: string): string {
	const oneSec = 1_000;

	const lastModified = new Date(timestamp * oneSec);

	const date = lastModified.getDate().toString();
	let month: string;
	try {
		month = lastModified.toLocaleString(
			locale.includes('_') ? locale.split('_')[0] : locale,
			{ month: 'short' }
		)
			.toLowerCase();
	}
	catch {
		month = lastModified.toLocaleString('en', { month: 'short' }).toLowerCase();
	}
	const monthFormatted = `${ month.charAt(0).toUpperCase() }${ month.slice(1) }`;
	const year = lastModified.getFullYear() % 100;

	return `${ date } ${ monthFormatted } '${ year }`;
}

export const Layout = ({
	id,
	url: layoutId,
	title,
	description,
	symbol,
	// TODO: uncomment in TVD-2083
	// logoUrls,
	modified,
	favorite = false,
	displayTitle,
	onFavouriteClick,
}: LayoutProps): JSX.Element => {
	const { t } = useTranslation();

	const { setContextMenuData, setSelectedLayout } = useContext(LayoutMenuContext);

	const [currentLocale, setCurrentLocale] = useState<string>('en');

	useObservable(localeServiceProxy().localeChange, setCurrentLocale);

	const { tvHost } = useTVHost();

	const layoutClickHandler = (ev: React.MouseEvent<HTMLLIElement>): void => {
		if (![MouseButton.Left, MouseButton.Middle].includes(ev.button)) {
			return;
		}

		const { tabId } = getRendererInitialData<RendererServiceData>();

		newTabServiceProxy().getFullLayoutUrl(layoutId)
			.then((fullLayoutUrl) =>
				newTabServiceProxy().loadURL(
					{
						url: fullLayoutUrl,
						title: symbol,
						tabId,
					},
					isOpenPageInNewTab(ev)
				)
			)
			.catch((error) => {
				loggerServiceProxy().error('<Layout>.layoutClickHandler(): newTabServiceProxy().getFullLayoutUrl() error', error);
			});
	};

	const favouriteClickHandler = (ev: React.MouseEvent<HTMLButtonElement>): void => {
		ev.stopPropagation();

		newTabServiceProxy().updateFavoriteLayout(layoutId, !favorite)
			.then((res) => {
				if (res) {
					onFavouriteClick(id, !favorite);
				}
			})
			.catch((error) => {
				loggerServiceProxy().error(
					`<Layout>.favouriteClickHandler(): newTabServiceProxy().updateFavoriteLayout(url: ${ layoutId }, favourite: ${ !favorite }) error`,
					error
				);
			});
	};

	const menuClickHandler = (ev: React.MouseEvent<HTMLButtonElement>): void => {
		ev.stopPropagation();

		const { x, y } = ev.currentTarget.getBoundingClientRect();

		setContextMenuData?.({
			isOpened: true,
			position: { x: x - CONTEXT_MENU_BY_BUTTON_X_OFFSET, y: y + CONTEXT_MENU_BY_BUTTON_Y_OFFSET },
			title: symbol,
			url: `${ tvHost }chart/${ layoutId }`,
		});

		setSelectedLayout?.({ layoutId, layoutName: title, isFavourite: favorite });

		getWindowControl().triggerMenuCloseEvent('context-menu')
			.catch((error) => {
				loggerServiceProxy().error('<Layout>.menuClickHandler(): getWindowControl().triggerMenuCloseEvent() error', error);
			});
	};

	const onContextMenu = ({ clientX, clientY }: React.MouseEvent): void => {
		setContextMenuData?.({
			isOpened: true,
			position: { x: clientX, y: clientY },
			title: symbol,
			url: `${ tvHost }chart/${ layoutId }`,
		});

		setSelectedLayout?.({ layoutId, layoutName: title, isFavourite: favorite });

		getWindowControl().triggerMenuCloseEvent('context-menu')
			.catch((error) => {
				loggerServiceProxy().error('<Layout>.onContextMenu(): getWindowControl().triggerMenuCloseEvent() error', error);
			});
	};

	return (
		<li
			onClick={ layoutClickHandler }
			onAuxClick={ layoutClickHandler }
			onContextMenu={ onContextMenu }
			onMouseDown={ preventScrollOnMiddleClick }
			className='layout-list-item'
			tabIndex={ 1 }
		>
			<div className='layout-list-item-row top'>
				{ /* TODO: uncomment in TVD-2083 */ }
				{ /* <LayoutLogo sources={ logoUrls } symbol={ symbol } /> */ }

				<TextButton
					color={ ButtonColor.Gray }
					size={ ButtonSize.Small }
					onClick={ favouriteClickHandler }
					iconOnly
					endIcon={ favorite ? starFillSvgIcon : starOutlineSvgIcon }
					className={ `favourite-button ${ favorite ? 'favourite' : '' }` }
					title={ favorite ? t('Remove from favorites') : t('Add to favorites') }
					tabIndex={ -1 }
				/>
			</div>

			<div className='layout-list-item-row bottom'>
				<div className='layout-list-item-info'>
					<Typography tag='span' name='typography-accent-16px-medium' className='layout-list-item-title'>
						{ displayTitle }
					</Typography>

					<Typography tag='span' name='typography-regular-13px' className='layout-list-item-description'>
						{ description } { bulletChar } { getLayoutLastModified(modified, currentLocale) }
					</Typography>
				</div>

				<TextButton
					color={ ButtonColor.Gray }
					size={ ButtonSize.Small }
					onClick={ menuClickHandler }
					iconOnly
					endIcon={ kebabMenuSvgIcon }
					tabIndex={ -1 }
				/>
			</div>
		</li>
	);
};
