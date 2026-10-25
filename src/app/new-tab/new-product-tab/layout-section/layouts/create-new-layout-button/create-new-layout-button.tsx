import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconplusSize28pxStroke1pxTypePlus as plusSvgIcon } from '@tradingview/ui-lib/icons/monochrome/plus/size_28px__stroke_1px__type_plus';
import { Typography } from '@tradingview/ui-lib/typography';

import { RendererServiceData } from '../../../../../../services/window/window-api';
import { getRendererInitialData } from '../../../../../common/app-common';

import './create-new-layout-button.css';

interface CreateNewLayoutButtonProps {
	openCreateLayoutModal(): void;
	openSignUpModal(): void;
}

export const CreateNewLayoutButton = ({ openCreateLayoutModal, openSignUpModal }: CreateNewLayoutButtonProps): JSX.Element => {
	const { t } = useTranslation();

	const [rendererData, setRendererData] = useState<RendererServiceData>();

	useEffect(() => {
		setRendererData(
			getRendererInitialData<RendererServiceData>()
		);
	}, []);

	const onClick = (): void => {
		if (!rendererData?.userId) {
			openSignUpModal();
			return;
		}

		openCreateLayoutModal();
	};

	return (
		<li className='layout-list-item create-new-layout-button' onClick={ onClick } tabIndex={ 1 }>
			<BlockIcon icon={ plusSvgIcon } />

			<Typography tag='span' name='typography-accent-16px-semibold' className='new-layout-button-text'>
				{ t('Create new layout') }
			</Typography>
		</li>
	);
};
