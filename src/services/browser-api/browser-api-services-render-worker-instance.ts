import { BrowserApiServicesRenderWorker } from './browser-api-services-render-worker';

let instance: BrowserApiServicesRenderWorker | null = null;

export async function createBrowserApiServicesRenderWorker(): Promise<BrowserApiServicesRenderWorker> {
	if (instance === null) {
		instance = await BrowserApiServicesRenderWorker.create();
	}

	return instance;
}

export function disposeBrowserApiServicesRenderWorker(): void {
	if (instance === null) {
		return;
	}

	instance.dispose();
	instance = null;
}
