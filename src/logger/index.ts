import { ipcMain } from 'electron';

import { Promisify } from '../ipc-remote';
import { IpcServices } from '../ipc-services';
import { ILoggerService, LOGGER_SERVICE_CONTRACT } from './ilogger-service';

export * from './ilogger-service';

// Additional function to use service without/before IPC Host initialization(in the same process as service)
// So far used only in Configuration loading code
//
// loggerService() and loggerServiceProxy() works the same as in the other services for consistency
// If we want to refactor this behavior its better to do so in general manner in IpcServices.provide
// as we dont need IPC initialization to work with local(instantiated in the same process) services
export function localLoggerService(): ILoggerService {
	return IpcServices.getProvider().provide<ILoggerService>(LOGGER_SERVICE_CONTRACT);
}

// we have code that uses loggerService but being imported and used by both Renderer and Main(example json-parse.ts)
export function checkedLoggerService(): ILoggerService | Promisify<ILoggerService> {
	if (ipcMain) {
		return IpcServices.getProvider().provide<ILoggerService>(LOGGER_SERVICE_CONTRACT);
	}

	return IpcServices.provideProxy<ILoggerService>(LOGGER_SERVICE_CONTRACT);
}

export function loggerService(): ILoggerService {
	return IpcServices.provide<ILoggerService>(LOGGER_SERVICE_CONTRACT);
}

export function loggerServiceProxy(): Promisify<ILoggerService> {
	return IpcServices.provideProxy<ILoggerService>(LOGGER_SERVICE_CONTRACT);
}
