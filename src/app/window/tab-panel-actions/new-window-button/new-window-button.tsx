import React from 'react';
import { useTranslation } from 'react-i18next';
import {
	svgIcondesktopTwoChartsSize28pxStroke1pxTypeNewWindowDesktop as doubleMonitorSvgIcon,
} from '@tradingview/ui-lib/icons/monochrome/desktop-two-charts/size_28px__stroke_1px__type_new-window-desktop';

import { loggerServiceProxy } from '../../../../logger';
import { windowServiceProxy } from '../../../../services/window';
import { Icon } from '../../../components-ui/icon';
import { ActionButton } from '../../action-button';

export const NewWindowButton = (): JSX.Element => {
	const { t } = useTranslation();

	const onNewWindowClick = (): void => {
		loggerServiceProxy().info('App render(): on new window click');

		windowServiceProxy().openNewWindow()
			.catch((error) => {
				loggerServiceProxy().error('<NewWindowButton>.onNewWindowClick(): windowServiceProxy().openNewWindow() error', error);
			});
	};

	return (
		<ActionButton
			onClick={ onNewWindowClick }
			icon={ <Icon icon={ doubleMonitorSvgIcon } /> }
			id='new-window-button'
			title={ t('Open new window') }
		/>
	);
};
