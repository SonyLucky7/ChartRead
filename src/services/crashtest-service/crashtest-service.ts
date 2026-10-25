import { BrowserWindow, ipcMain } from 'electron';
import { enable } from '@electron/remote/main';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { emitAccessViolation, emitStackOverflow } from '../../native';
import { FileSystemProvider } from '../../providers/file-system-provider';
import { CRASHTEST_SERVICE_CONTRACT, ICrashTestService } from './icrashtest-service';

export async function createCrashTestView(): Promise<void> {
	const wnd = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	enable(wnd.webContents);

	await wnd.loadFile(FileSystemProvider.makeAppRootPath('/app/crash-view/index.html'));
}

@ExposeSingletonService(CRASHTEST_SERVICE_CONTRACT, IpcServices.getProvider())
export class CrashTestService implements ICrashTestService {
	crashNativeProcess(): void {
		process.crash();
	}

	crashJs(): void {
		// We should throw the exception on a separate call stack to avoid exception being caught by the rpc invoker without rethrow
		// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-floating-promises
		(async() => {
			throw new Error(`${ ipcMain ? 'Main' : 'Renderer' } process JS error`);
		})();
	}

	crashNativeModuleAV(): void {
		emitAccessViolation();
	}

	crashNativeModuleSO(): void {
		emitStackOverflow();
	}
}
