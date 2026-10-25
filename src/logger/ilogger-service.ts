import { Promisify } from '../ipc-remote';
import { Disposable } from '../tvd-runtime/core';

export const LOGGER_SERVICE_CONTRACT = 'tvd:logger-service';

export enum LogLevel {
	Debug,
	Info,
	Warn,
	Error,
}

export interface IpcLogData {
	message: string;
	level: LogLevel;
	error?: unknown;
}

export interface ILogSink extends Disposable {
	readonly level: LogLevel;
	write(message: LogMessage): void | Promise<void>;
}

export type SinkProvider = ILogSink | Promisify<ILogSink> | (() => Promise<ILogSink | Promisify<ILogSink>>);

export interface ILoggerServiceInitialization extends Disposable {
	setup(sinks: Array<SinkProvider>): void;
}

export interface LogMessage {
	timestamp: string;
	level: LogLevel;
	body: string;
	stackTrace?: string;
}

export interface ILogFormatter {
	format(message: string, logLevel: LogLevel, err?: unknown): LogMessage;
}

export interface ILoggerService extends Disposable {
	info(message: string): void;
	debug(message: string): void;
	error(message: string, error?: unknown): void;
	warn(message: string): void;
	getLatestLogs(): Promise<string>;
}
