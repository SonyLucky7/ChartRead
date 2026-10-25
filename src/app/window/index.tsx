import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../../sentry/renderer';
import { initRenderHeapLog } from '../renderer-services/log-heap';
import { AppContainer } from './app-container';
import { applyLayoutCssVariables } from './layout-css-variables';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();
applyLayoutCssVariables();

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<AppContainer/>);
}
