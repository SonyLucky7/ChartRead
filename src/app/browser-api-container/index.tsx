import React from 'react';
import { createRoot } from 'react-dom/client';

import { IpcServices } from '../../ipc-services';
import { initSentryRenderer } from '../../sentry/renderer';
import { SoundPlayer } from '../../services/browser-api/sound-player';
import { notifyViewReady } from '../common/app-common';
import { initRenderHeapLog } from '../renderer-services/log-heap';

import '../../index.css';

initSentryRenderer();
initRenderHeapLog();

IpcServices.initializeRpc();

function initializeSoundService(): void {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function registerServiceFactory(...services: unknown[]): void {}

	registerServiceFactory(SoundPlayer);

	notifyViewReady();
}

initializeSoundService();

const documentRoot = document.getElementById('root');

if (documentRoot) {
	const root = createRoot(documentRoot);
	root.render(<></>);
}
