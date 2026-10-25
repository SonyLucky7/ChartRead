import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../sentry/renderer';
import TabMonitor from './tab-monitor/tab-monitor';

import '../index.css';

initSentryRenderer();

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<TabMonitor />);
}
