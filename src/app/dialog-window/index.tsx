import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../../sentry/renderer';
import { DialogData, DialogProps, DialogType } from '../../services/window/window-api';
import { initRenderHeapLog } from '../renderer-services/log-heap';
import { ContentRenderer } from '../renderer-services/renderer';
import { DialogWindowContainer } from './dialog-window-container';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();

export const dialogContentRenderer = new ContentRenderer<DialogType, DialogProps<DialogData>>();

dialogContentRenderer.registerLazyRenderer(DialogType.Options,
	React.lazy(() => import('./options-dialog')));

dialogContentRenderer.registerLazyRenderer(DialogType.Credentials,
	React.lazy(() => import('./credential-dialog')));

dialogContentRenderer.registerLazyRenderer(DialogType.Settings,
	React.lazy(() => import('./settings-dialog')));

dialogContentRenderer.registerLazyRenderer(DialogType.SaveChanges,
	React.lazy(() => import('./save-changes-dialog')));

dialogContentRenderer.registerLazyRenderer(DialogType.Welcome,
	React.lazy(() => import('./welcome-dialog')));

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<React.Suspense fallback={ false }><DialogWindowContainer/></React.Suspense>);
}
