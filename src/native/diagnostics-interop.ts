import { loggerService, LogLevel } from '../logger';
import { getNativeBridge } from './tvd-bridge';

type LogCallback = (message: string, level: LogLevel) => void;

interface DiagInterop {
	setLogHandler(callback: LogCallback): void;
}

export function initializeDiagnosticsInterop(): void {
	const diagnostics = getNativeBridge().diagnostics as DiagInterop;

	diagnostics.setLogHandler((message: string, level: LogLevel): void => {
		switch (level) {
			case LogLevel.Debug: {
				loggerService().debug(message);
				break;
			}
			case LogLevel.Warn: {
				loggerService().warn(message);
				break;
			}
			case LogLevel.Error: {
				loggerService().error(message);
				break;
			}
			case LogLevel.Info:
			default: loggerService().info(message);
		}
	});
}
