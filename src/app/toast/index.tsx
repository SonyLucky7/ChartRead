import '../../services/locale/i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { initSentryRenderer } from '../../sentry/renderer';
import { ToastData, ToastRendererType } from '../../services/window/toast';
import { ToastViewProps } from '../renderer-services';
import { initRenderHeapLog } from '../renderer-services/log-heap';
import { ContentRenderer } from '../renderer-services/renderer';
import Toast from './toast-component';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();

export const toastContentRenderer = new ContentRenderer<ToastRendererType, ToastViewProps<ToastData>>();

const toastRenderers: Record<ToastRendererType, React.LazyExoticComponent<React.ComponentType<any>>> = {
	[ToastRendererType.Download]: React.lazy(() => import('./download-toast/download-toast')),
	[ToastRendererType.Fullscreen]: React.lazy(() => import('./fullscreen-toast/fullscreen-toast')),
	[ToastRendererType.Zoom]: React.lazy(() => import('./zoom-toast/zoom-toast')),
};

for (const type of Object.keys(toastRenderers) as ToastRendererType[]) {
	toastContentRenderer.registerLazyRenderer(type, toastRenderers[type]);
}

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<Toast/>);
}
