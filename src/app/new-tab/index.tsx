import { ipcRenderer } from 'electron';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { loggerServiceProxy } from '../../logger';
import { initSentryRenderer } from '../../sentry/renderer';
import { GET_TABBED_WINDOW_ID } from '../../tv-api';
import { initRenderHeapLog } from '../renderer-services/log-heap';
import { NewTabTransContainer } from './new-tab-container';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();

ipcRenderer.invoke(GET_TABBED_WINDOW_ID)
	.then((remoteServiceInstanceId: string) => {
		window.remoteServiceInstanceId = remoteServiceInstanceId;
	})
	.catch((error) => {
		loggerServiceProxy().error('NewTab root render error', error);
	})
	.finally(() => {
		const documentRoot = document.getElementById('root');

		if (documentRoot) {
			const root = createRoot(documentRoot);

			root.render(<NewTabTransContainer />);
		}
	});
