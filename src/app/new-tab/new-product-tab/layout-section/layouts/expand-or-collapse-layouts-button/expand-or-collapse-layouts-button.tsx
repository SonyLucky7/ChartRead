import clsx from 'clsx';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@tradingview/ui-lib/icon';
import { svgIconarrowSize18pxStroke2pxTypeMiniDirectionDown as arrowMiniDownSvgIcon } from '@tradingview/ui-lib/icons/monochrome/arrow/size_18px__stroke_2px__type_mini__direction_down';
import { svgIconarrowSize18pxStroke2pxTypeMiniDirectionUp as arrowMiniUpSvgIcon } from '@tradingview/ui-lib/icons/monochrome/arrow/size_18px__stroke_2px__type_mini__direction_up';
import { Typography } from '@tradingview/ui-lib/typography';
import linkColorMixin from '@tradingview/ui-lib/utils/mixin-class.css.json';

import './expand-or-collapse-layouts-button.css';

interface GetButtonTextOptions {
	t: TFunction;
	isLayoutsExpanded: boolean;
	isSearching: boolean;
	layoutCount: number;
}

interface ExpandOrCollapseButtonProps {
	onClick(): void;
	isLayoutsExpanded: boolean;
	isSearching: boolean;
	layoutCount: number;
}

function getButtonText({
	t,
	isLayoutsExpanded,
	isSearching,
	layoutCount,
}: GetButtonTextOptions): string {
	if (isLayoutsExpanded) {
		return t('Collapse');
	}

	if (!isSearching) {
		return `${ t('All layouts') } (${ layoutCount })`;
	}

	return `${ t('See all results') } (${ layoutCount })`;
}

export const ExpandOrCollapseLayoutsButton = ({
	onClick,
	isLayoutsExpanded,
	isSearching,
	layoutCount,
}: ExpandOrCollapseButtonProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<button
			onClick={ onClick }
			className={ clsx(['layout-list-expand-button', linkColorMixin['link-colors']]) }
		>
			<Icon icon={ isLayoutsExpanded ? arrowMiniUpSvgIcon : arrowMiniDownSvgIcon } className='ui-lib-icon' />
			<Typography tag='span' name='typography-accent-16px-semibold'>
				{ getButtonText({ t, isLayoutsExpanded, isSearching, layoutCount }) }
			</Typography>
		</button>
	);
};
