import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { app } from '@electron/remote';

import { loggerServiceProxy } from '../../../../logger';
import { windowServiceProxy } from '../../../../services/window';
import { getWindowControl } from '../../../common/app-common';
import { useObservable } from '../../../components-ui/hooks';
import { ActionButton } from '../../action-button';

import CloseWindow from './assets/close.svg';
import QuitApp from './assets/quit-app.svg';

import './button-close.css';

const updateShouldQuitApp = (
	setShouldQuitApp: (value: boolean) => void,
	setCountWindows: (value: number) => void,
	countWindows: number
): void => {
	setCountWindows(countWindows);

	if (countWindows >= 1) {
		setShouldQuitApp(true);
		return;
	}

	setShouldQuitApp(false);
};

export const ButtonClose = (): JSX.Element => {
	const { t } = useTranslation();

	const [shouldQuitApp, setShouldQuitApp] = useState<boolean>(false);
	const [countWindows, setCountWindows] = useState<number>(1);

	useEffect(() => {
		windowServiceProxy().getCountWindows()
			.then((count) => {
				updateShouldQuitApp(setShouldQuitApp, setCountWindows, count);
			})
			.catch((error) => {
				loggerServiceProxy().error('<ButtonClose>.useEffect(): getWindowService().getCountWindows() error', error);
			});
	}, []);

	const windowCountHandler = (count: number): void => {
		updateShouldQuitApp(setShouldQuitApp, setCountWindows, count);
	};

	useObservable<number>(windowServiceProxy().chartWindowSubject, windowCountHandler);

	const close = useCallback((ev: React.MouseEvent) => {
		if (shouldQuitApp && !ev.shiftKey) {
			loggerServiceProxy().info('Close button clicked - quitting app');
			app.quit();
			return;
		}

		loggerServiceProxy().info('Close button clicked - closing window');
		getWindowControl().close()
			.catch((error) => {
				loggerServiceProxy().error('<ButtonClose>.close(): getWindowControl().close() error', error);
			});
	}, [shouldQuitApp]);

	const handleQuitMouseMove = useCallback((ev: React.MouseEvent): void => {
		if (ev.shiftKey && shouldQuitApp) {
			setShouldQuitApp(false);
		}
	}, [shouldQuitApp]);

	const handleCloseMouseMove = useCallback((ev: React.MouseEvent): void => {
		if (!ev.shiftKey && !shouldQuitApp) {
			setShouldQuitApp(countWindows > 1);
		}
	}, [countWindows, shouldQuitApp]);

	const handleMouseLeave = useCallback(() => {
		windowServiceProxy().getCountWindows()
			.then((count) => {
				updateShouldQuitApp(setShouldQuitApp, setCountWindows, count);
			})
			.catch((error) => loggerServiceProxy().error('<ButtonClose>: getWindowService().getCountWindows() error in handleMouseLeave()', error));
	}, []);

	const quitButtonTooltipMessageFirstPart = t('Click to quit the app');
	const quitButtonTooltipMessageSecondPart = t('Use Shift+click or Alt+F4 to close only this window');

	return shouldQuitApp
		? <ActionButton
			onClick={ close }
			icon={ countWindows === 1 ? <CloseWindow /> : <QuitApp /> }
			id='close'
			className='window-control close-button'
			onMouseMove={ handleQuitMouseMove }
			title={ `${ quitButtonTooltipMessageFirstPart }\n${ quitButtonTooltipMessageSecondPart }` }
		/>
		: <ActionButton
			onClick={ close }
			icon={ <CloseWindow /> }
			id='close'
			className='window-control close-button'
			onMouseMove={ handleCloseMouseMove }
			onMouseLeave={ handleMouseLeave }
			title={ t('Close window') }
		/>;
};
