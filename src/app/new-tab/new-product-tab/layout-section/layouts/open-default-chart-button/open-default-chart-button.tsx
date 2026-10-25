import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, TextButton } from '@tradingview/ui-lib/buttons/text-button';
import { Icon } from '@tradingview/ui-lib/icon';
import { svgIconkebabMenuSize18pxFilledOn as kebabMenuSvgIcon } from '@tradingview/ui-lib/icons/monochrome/kebab-menu/size_18px__filled_on';
import { svgIconsuperchartsSize28pxStroke1 as chartDiamondSvgIcon } from '@tradingview/ui-lib/icons/monochrome/supercharts/size_28px__stroke_1.5px__filled_on__usage_mobile-tab-bar';
import { Typography } from '@tradingview/ui-lib/typography';

import { MouseButton } from '../../../../../../native/hardware';
import { DEFAULT_TAB_TITLE } from '../../../../../../services/interfaces';
import { newTabServiceProxy } from '../../../../../../services/new-tab';
import { useTVHost } from '../../../../../components-ui/hooks';
import { isOpenPageInNewTab, preventScrollOnMiddleClick } from '../../../../new-product-tab';
import { LayoutMenuContext } from '../../layout-section';

import './open-default-chart-button.css';

interface OpenDefaultChartButtonProps {
	tabId?: string;
}

const CONTEXT_MENU_BY_BUTTON_X_OFFSET = 4;
const CONTEXT_MENU_BY_BUTTON_Y_OFFSET = 22;

export const OpenDefaultChartButton = ({ tabId }: OpenDefaultChartButtonProps): JSX.Element => {
	const { t } = useTranslation();

	const { setContextMenuData } = useContext(LayoutMenuContext);

	const { tvHost } = useTVHost();

	const onClick = (ev: React.MouseEvent<HTMLLIElement>): void => {
		if (ev.button !== MouseButton.Left && ev.button !== MouseButton.Middle) {
			return;
		}

		if (!tvHost) {
			return;
		}

		newTabServiceProxy().loadURL(
			{
				url: `${ tvHost }chart`,
				tabId,
			},
			isOpenPageInNewTab(ev)
		);
	};

	const menuClickHandler = (ev: React.MouseEvent<HTMLButtonElement>): void => {
		ev.stopPropagation();

		const { x, y } = ev.currentTarget.getBoundingClientRect();

		setContextMenuData?.({
			isOpened: true,
			position: { x: x - CONTEXT_MENU_BY_BUTTON_X_OFFSET, y: y + CONTEXT_MENU_BY_BUTTON_Y_OFFSET },
			title: DEFAULT_TAB_TITLE,
			url: `${ tvHost }chart`,
		});
	};

	const onContextMenu = ({ clientX, clientY }: React.MouseEvent): void => {
		setContextMenuData?.({
			isOpened: true,
			position: { x: clientX, y: clientY },
			title: DEFAULT_TAB_TITLE,
			url: `${ tvHost }chart`,
		});
	};

	return (
		<li
			onClick={ onClick }
			onAuxClick={ onClick }
			onContextMenu={ onContextMenu }
			onMouseDown={ preventScrollOnMiddleClick }
			className='layout-list-item open-chart-button'
			tabIndex={ 1 }
		>
			<Icon icon={ chartDiamondSvgIcon } className='ui-lib-icon open-chart-button-icon' />

			<div className='layout-list-item-row'>
				<Typography tag='span' name='typography-accent-16px-medium' className='open-chart-button-text'>
					{ t('Open chart') }
				</Typography>

				<TextButton
					color={ ButtonColor.Gray }
					size={ ButtonSize.Small }
					onClick={ menuClickHandler }
					iconOnly
					endIcon={ kebabMenuSvgIcon }
				/>
			</div>
		</li>
	);
};
