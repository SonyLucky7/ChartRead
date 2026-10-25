import { app, ipcMain } from 'electron';

import { Promisify } from '../ipc-remote';
import { ExposeSingletonService, IpcServices } from '../ipc-services';
import { LoggerIntegration } from '../sentry/integrations/logger-integration';
import { getConfiguration } from '../services/configuration';
import { LOG } from '../tv-api/tvd-channels';
import { getMessageOfError } from '../tvd-runtime/core/utils/type-utils';
import { ignorePromise } from '../utils';
import { ConsoleSink, FileSink } from './base-sinks';
import { ILogFormatter, ILoggerService, ILoggerServiceInitialization, ILogSink, IpcLogData, LOGGER_SERVICE_CONTRACT, LogLevel, LogMessage, SinkProvider } from './ilogger-service';
import { LogFormatter } from './log-formatter';
import { loggerService } from '.';

interface SinkEntry {
	sink: SinkProvider | Promise<ILogSink | Promisify<ILogSink>> | null;
}

export function initializeLogger(): void {
	const logger = loggerService();
	const config = getConfiguration();

	if (config.advanced.dohProviders && config.advanced.dohProviders.length !== 0) {
		app.configureHostResolver({ secureDnsServers: config.advanced.dohProviders, secureDnsMode: 'secure' });
	}

	const sinks: Array<SinkProvider> = [];

	if (config.logging.file.enabled) {
		sinks.push(new FileSink(config.logging.file.logLevel));
	}

	if (config.logging.console.enabled) {
		sinks.push(new ConsoleSink(config.logging.console.logLevel));
	}

	(logger as LoggerService).setup(sinks);
	logger.debug('Logger initialized');
}

@ExposeSingletonService(LOGGER_SERVICE_CONTRACT, IpcServices.getProvider())
export class LoggerService implements ILoggerService, ILoggerServiceInitialization {
	private readonly sinks: Array<SinkEntry> = [];
	private queuedMessages: LogMessage[] = [];
	private formatter!: ILogFormatter;

	private lastWriteOp: Promise<void> | undefined;

	constructor() {
		console.log('Initializing LoggerService');
		this.formatter = new LogFormatter();
		this.setPreloadApiLogHandler();
	}

	getLatestLogs(): Promise<string> {
		return FileSink.getRecentLogs();
	}

	setup(sinks: SinkProvider[], formatter?: ILogFormatter): void {
		this.sinks.push(...sinks.map(sink => {
			return { sink };
		}));

		if (formatter) {
			this.formatter = formatter;
		}

		LoggerIntegration.setupLoggerFunction((message: string) => {
			this.warn(message);
		});
	}

	info(message: string): void {
		const logMsg = this.formatter.format(message, LogLevel.Info);
		this.write(logMsg);
	}

	debug(message: string): void {
		const logMsg = this.formatter.format(message, LogLevel.Debug);
		this.write(logMsg);
	}

	warn(message: string): void {
		const logMsg = this.formatter.format(message, LogLevel.Warn);
		this.write(logMsg);
	}

	error(message: string, error: unknown): void {
		const logMsg = this.formatter.format(message, LogLevel.Error, error);
		this.write(logMsg);
	}

	dispose(): void {
		ignorePromise(this.disposeSinks());
	}

	private write(message: LogMessage): void {
		if (!this.sinks || this.sinks.length === 0) {
			this.queuedMessages.push(message);
			return;
		}

		const asyncWrite = async(): Promise<void> => {
			if (this.queuedMessages.length > 0) {
				const queuedMessages = this.queuedMessages;
				this.queuedMessages = [];

				for (const msg of queuedMessages) {
					await this.transmitToSinks(msg);
				}
			}

			await this.transmitToSinks(message);
		};

		const callWrite = (prevWriteOp: Promise<void>): Promise<void> => {
			return prevWriteOp.then(() => {
				this.lastWriteOp = asyncWrite();
			});
		};

		if (this.lastWriteOp) {
			ignorePromise(callWrite(this.lastWriteOp));

			return;
		}

		this.lastWriteOp = asyncWrite();
	}

	private async transmitToSinks(message: LogMessage): Promise<void> {
		const promises: Promise<void>[] = [];

		for (const sinkEntry of this.sinks) {
			if (!sinkEntry.sink) {
				continue;
			}

			try {
				if (typeof sinkEntry.sink === 'function') {
					sinkEntry.sink = sinkEntry.sink();
				}

				if (sinkEntry.sink instanceof Promise) {
					sinkEntry.sink = await sinkEntry.sink;
				}

				const awaiter = sinkEntry.sink.write(message);
				if (awaiter instanceof Promise) {
					promises.push(awaiter.catch((error: unknown) => {
						console.debug(getMessageOfError(error));
						sinkEntry.sink = null;
					}));
				}
			}
			catch (error: unknown) {
				console.debug(getMessageOfError(error));
				sinkEntry.sink = null;
			}
		}

		if (promises.length > 0) {
			await Promise.all(promises);
		}
	}

	private async disposeSinks(): Promise<void> {
		if (this.lastWriteOp) {
			await this.lastWriteOp;
		}

		for (const sinkEntry of this.sinks) {
			if (sinkEntry.sink === null || typeof sinkEntry.sink === 'function') {
				continue;
			}

			try {
				if (sinkEntry.sink instanceof Promise) {
					sinkEntry.sink = await sinkEntry.sink;
				}

				const sink = sinkEntry.sink;
				sinkEntry.sink = null;

				const maybePromise = sink.dispose();

				if (maybePromise instanceof Promise) {
					await maybePromise;
				}
			}
			catch (err) {
				console.debug('Sink already disposed');
				console.debug(err);
			}
		}
	}

	private setPreloadApiLogHandler(): void {
		ipcMain.handle(LOG, (ev, logData: IpcLogData) => {
			const logMsg = this.formatter.format(logData.message, logData.level, logData.error);
			this.write(logMsg);
		});
	}

	// private removeSink(sink: Promise<ILogSink>): void {
	// 	const sinkIndex = this.sinks.findIndex(s => s === sink);
	// 	this.sinks.splice(sinkIndex, 1);
	// }
}
