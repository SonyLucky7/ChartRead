import * as fs from 'fs';
import * as path from 'path';

import { setupCustomEvent } from '../sentry/renderer';

const TVDBRIDGE_MODULE_NAME = 'tvdbridge';

interface ModuleObject {
	exports: Record<any, unknown>;
}

interface ProcessWithDlOpen {
	dlopen(module: ModuleObject, dllPath: string, flags?: number): void;
}

export interface NativeTvdBridge {
	readonly available: boolean;
	[key: string]: unknown;

	shutdown(): void;
}

let tvdBridge: NativeTvdBridge | undefined;

function loadNativeModule(name: string): unknown {
	const moduleFileName = path.extname(name) === '' ? `${ name }.node` : name;

	const dllPath: string = ((): string => {
		const app = (process && process.type === 'renderer'
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			? require('@electron/remote').app
			: require('electron').app) as unknown as Electron.App;

		const appDir = app.getAppPath();

		// const NATIVE_BUILD_PATH = path.join('src_native', '.build', '.target');
		// type BuildType = 'Debug' | 'ReleaseWithDebInfo' | 'Release'
		// const buildTypes: BuildType[] = getConfiguration().advanced.developerMode ?
		// 	['Debug', 'ReleaseWithDebInfo', 'Release']:
		// 	['ReleaseWithDebInfo', 'Release', 'Debug'];

		// const pathToBuildTree = path.join(appDir, NATIVE_BUILD_PATH);

		// for (const bt of buildTypes) {
		// 	const buildPath = path.join(pathToBuildTree, bt, moduleFileName);
		// 	if (fs.existsSync(buildPath)) {
		// 		return buildPath;
		// 	}
		// }

		const pathToDist = path.join(appDir, 'native', moduleFileName);
		if (!fs.existsSync(pathToDist)) {
			throw new Error(`Module (${ moduleFileName }) not found`);
		}

		return pathToDist;
	})();

	const module: ModuleObject = { exports: {} };
	(process as unknown as ProcessWithDlOpen).dlopen(module, dllPath);

	return module.exports;
}

class InvalidTvdBridge implements ProxyHandler<Record<string, unknown>> {

}

// class CallInterceptor implements ProxyHandler<any> {

// 	get(target: any, propKey: string): unknown {
// 		return (target as Record<string, unknown>)[propKey];
// 	}
// }

export function getNativeBridge(): NativeTvdBridge {
	if (typeof tvdBridge === 'undefined') {
		console.debug('Initializing TVD bridge');
		try {
			tvdBridge = loadNativeModule(TVDBRIDGE_MODULE_NAME) as NativeTvdBridge;
			// tvdBridge.hardware = new Proxy(tvdBridge.hardware, new CallInterceptor());

			console.log('Got bridge');
			Object.defineProperty(tvdBridge, 'available', {
				value: true,
				writable: false,
				configurable: false,
			});
		}
		catch (error: unknown) {
			console.log(error);
			const target: NativeTvdBridge = {
				available: false,
				shutdown(): void {
				},
			};

			tvdBridge = new Proxy(target, new InvalidTvdBridge());

			setupCustomEvent('bridge-not-loaded');
			throw new Error('bridge-not-loaded');
		}
	}

	return tvdBridge;
}

export function nativeBridgeInitialized(): boolean {
	return typeof tvdBridge !== undefined;
}
