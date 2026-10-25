import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../../sentry/renderer';
import { initRenderHeapLog } from '../renderer-services/log-heap';
import CrashTestView from './crash-view';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<CrashTestView/>);
}
