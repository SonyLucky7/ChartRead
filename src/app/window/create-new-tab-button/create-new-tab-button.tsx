import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClickableIconButton } from '@tradingview/ui-lib/buttons/icon-button';
import { svgIconplusSize18pxStroke1pxTypePlus as plusSvgIcon } from '@tradingview/ui-lib/icons/monochrome/plus/size_18px__stroke_1px__type_plus';

import { loggerServiceProxy } from '../../../logger';
import { getWindowControl } from '../../common/app-common';

import './create-new-tab-button.css';

interface CreateNewTabButtonProps {
	offset: number;
}

function createNewTab(): void {
	getWindowControl().createAndAddTab({})
		.catch((error) => {
			loggerServiceProxy().error('<CreateNewTabButton>.createNewTab(): getWindowControl().createAndAddTab() error', error);
		});
}

export const CreateNewTabButton = ({ offset }: CreateNewTabButtonProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className='create-new-tab-button-container' style={ { left: `${ offset }px` } }>
			<ClickableIconButton
				title={ t('New tab') }
				icon={ plusSvgIcon }
				onClick={ createNewTab }
				colorClassName='create-new-tab-button'
				tabIndex={ -1 }
			/>
		</div>
	);
};
