import React from 'react';
import { createRoot } from 'react-dom/client';

import { IpcServices } from '../../ipc-services';
import { initSentryRenderer } from '../../sentry/renderer';
import i18n from '../../services/locale/i18n';
import { MenuData, MenuType } from '../../services/window/menu-window-types';
import { setDirection } from '../../utils';
import { getRendererInitialData } from '../common/app-common';
import { Menu } from './menu-window';
import { TabGroupMenu } from './tab-group-menu';

import '../../index.css';

initSentryRenderer();

setDirection(i18n);

IpcServices.initializeRpc();

i18n.on('languageChanged', () => {
	setDirection(i18n);
});

const rootElement = document.getElementById('root');

if (rootElement) {
	rootElement.classList.remove('invisible-root');

	const root = createRoot(rootElement);
	const menuType = getRendererInitialData<MenuData>().type;
	root.render(menuType === MenuType.TabGroup ? <TabGroupMenu/> : <Menu/>);
}
