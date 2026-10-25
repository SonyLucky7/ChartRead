import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { setupI18nLocaleHandler } from '../../services/locale';
import { TabTitleViewType, TooltipData, TooltipRequest } from '../../services/window/window-api';
import { isDarwin } from '../../utils';
import { getWindowControl } from '../common/app-common';
import { useObservable } from '../components-ui/hooks';
import { TabTitle } from '../window/tab-panel/tab/tab-title';

import './tooltip.css';

IpcServices.initializeRpc();

export const TabTooltip = (): JSX.Element => {
	const { t } = useTranslation();

	const [lastRequestText, setLastRequestText] = useState<TooltipData>({
		type: TabTitleViewType.Basic,
		title: '',
	});
	const [isActive, setIsActive] = useState<boolean>(false);

	useObservable<TooltipRequest>(getWindowControl().tooltipTextChange, ({ text }) => {
		setLastRequestText(text);
	});

	useObservable(getWindowControl().tooltipActivateState, setIsActive);

	useEffect(() => {
		setupI18nLocaleHandler(document.documentElement);

		const closeTooltip: () => void = () => {
			getWindowControl().closeTooltip()
				.catch((error) => {
					loggerServiceProxy().error('<Tooltip>.closeTooltip(): getWindowControl().closeTooltip() error', error);
				});
		};

		if (!isDarwin()) {
			document.querySelector('body')?.addEventListener('mouseenter', closeTooltip);
		}

		return () => {
			if (!isDarwin()) {
				document.querySelector('body')?.removeEventListener('mouseenter', closeTooltip);
			}
		};
	}, []);

	return (
		<div className={ `tab-tooltip ${ isActive ? 'active' : '' }` }>
			<TabTitle
				title={ lastRequestText }
				isLogoVisible={ false }
				isTooltip
				t={ t }
			/>
		</div>
	);
};
