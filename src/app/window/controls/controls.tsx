import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Observable } from 'rxjs';

import { loggerServiceProxy } from '../../../logger';
import { TitleBarOptions, TitleBarWindowData, WindowState } from '../../../services/window/window-api';
import { isDarwin } from '../../../utils/platform';
import { getRendererInitialData, getWindowControl } from '../../common/app-common';
import { useObservable } from '../../components-ui/hooks';
import { ActionButton } from '../action-button';
import { ButtonClose } from './button-close';

import ExitFullscreen from './assets/exit-fullscreen.svg';
import Maximize from './assets/maximize.svg';
import Minimize from './assets/minimize.svg';
import Restore from './assets/restore.svg';

import './controls.css';

interface WindowStateButton {
	icon: JSX.Element;
	title: string;
}

interface ControlsProps {
	windowStateSubject: Observable<WindowState>;
}

function getMaximiseButtonState(windowState: WindowState | undefined, t: TFunction): WindowStateButton {
	if (windowState === WindowState.FullscreenWithPanel) {
		return { icon: <ExitFullscreen />, title: t('Exit full screen') };
	}

	if (windowState === WindowState.Maximized) {
		return { icon: <Restore />, title: t('Restore') };
	}

	return { icon: <Maximize />, title: t('Maximize') };
}

export const Controls = ({ windowStateSubject }: ControlsProps): JSX.Element => {
	const { t } = useTranslation();

	const [windowState, setWindowState] = useState<WindowState>();
	const [titleBarOptions] = useState<TitleBarOptions>(getRendererInitialData<TitleBarWindowData>().titleBarOptions);

	useObservable(windowStateSubject, setWindowState);

	const minimise = (): void => {
		getWindowControl().closeHTMLFullscreen()
			.then(() => {
				getWindowControl().toggleMinimize()
					.catch((error) => {
						loggerServiceProxy().error('<Controls>.minimize(): getWindowControl().toggleMinimize() error', error);
					});
			})
			.catch((error) => {
				loggerServiceProxy().error('<Controls>.minimise(): getWindowControl().closeHTMLFullscreen() error', error);
			});
	};

	const toggleMaximise = (): void => {
		if (windowState === WindowState.FullscreenWithPanel) {
			getWindowControl().toggleFullscreen()
				.catch((error) => {
					loggerServiceProxy().error('<Controls>.toggleMaximise(): getWindowControl().toggleFullscreen() error', error);
				});
			return;
		}

		getWindowControl().toggleMaximize()
			.catch((error) => {
				loggerServiceProxy().error('<Controls>.toggleMaximise(): getWindowControl().toggleMaximize() error', error);
			});
	};

	const maximiseButtonState = getMaximiseButtonState(windowState, t);

	return (
		<>
			{ isDarwin()
				? <div className='window-controls darwin' />
				: <div className='window-controls'>
					{ titleBarOptions.showMinimize &&
						<ActionButton
							onClick={ minimise }
							icon={ <Minimize /> }
							id='minimize'
							className='window-control'
							title={ t('Minimize') }
						/>
					}
					{ titleBarOptions.showMaximize &&
						<ActionButton
							onClick={ toggleMaximise }
							icon={ maximiseButtonState.icon }
							id='maximize'
							className='window-control'
							title={ maximiseButtonState.title }
						/>
					}
					<ButtonClose />
				</div>
			}
		</>
	);
};
