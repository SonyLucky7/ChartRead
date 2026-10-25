import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../../../sentry/renderer';
import { initRenderHeapLog } from '../log-heap';
import { initializeDragService } from './native-drag-service-imports';

import '../../../index.css';

const checkInterval = 3000;

initSentryRenderer();
initRenderHeapLog(checkInterval);

initializeDragService();

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<></>);
}
