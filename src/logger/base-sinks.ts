import * as path from 'path';
import { ReplaySubject } from 'rxjs';

import { FileSystemProvider as fs, WriteStream } from '../providers/file-system-provider';
import { FileInformation } from '../providers/interfaces';
import { getConfiguration } from '../services/configuration';
import { ignorePromise } from '../utils';
import { ILogSink, LogLevel, LogMessage } from './ilogger-service';
import { loggerService } from '.';

export class BaseSink implements ILogSink {
	protected readonly bufferSize = 100;
	protected isReady!: boolean;
	protected messageQueue: ReplaySubject<LogMessage>;

	readonly level: LogLevel;

	constructor(level: LogLevel) {
		this.level = level;
		this.messageQueue = new ReplaySubject<LogMessage>(this.bufferSize);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	write(message: LogMessage): void {
		throw new Error('Base sink has no write stream');
	}

	dispose(): void {
	}
}

export class ConsoleSink extends BaseSink {
	constructor(level: LogLevel) {
		super(level);
		this.isReady = true;
	}

	override write(message: LogMessage): void {
		if (this.level > message.level) {
			return;
		}

		console.debug(`${ message.timestamp } ${ message.body }`);

		if (message.stackTrace) {
			console.debug(message.stackTrace);
		}
	}

	override dispose(): void {
	}
}

export class FileSink extends BaseSink {
	private static logsPath: string | undefined;
	private stream: WriteStream | undefined;

	/**
	 * @description in Bytes
	 */
	private readonly maxLogFileSize: number;

	private static async removeOldLogs(logsPath: string): Promise<void> {
		const daysToKeepLog = 7;
		const now = new Date();

		const files = await fs.readDirAsync(logsPath); // await new Promise<string[]>((resolve) => {

		for (const logFileName of files) {
			const fullPath = path.join(logsPath, logFileName);

			try {
				const logFileStat = await fs.fileStats(fullPath, { bigint: true });

				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				const msInDay = 1000 * 3600 * 24;
				const daysOld = (now.getTime() - logFileStat.ctime.getTime()) / msInDay;
				if (daysOld > daysToKeepLog) {
					await fs.deleteAsync(fullPath);
				}
			}
			catch (err) {
				loggerService().error(`[FileSink.removeOldLogs()] Error occured while deleting log file ${ fullPath } `, err);
				return;
			}
		}
	}

	private static getLogsPath(): string {
		if (!this.logsPath) {
			this.logsPath = fs.makeAppDataPath('logs');
		}

		return this.logsPath;
	}

	private static getNextLogFilePath(): string {
		const logsPath = this.getLogsPath();
		if (!fs.exists(logsPath)) {
			fs.createDir(logsPath, {});
		}

		ignorePromise(this.removeOldLogs(logsPath));

		const d = new Date();
		const timeStamp = `${ d.getDate() }-${ d.getMonth() + 1 }-${ d.getFullYear() }_${ d.getHours() }-${ d.getMinutes() }`;

		const makeLogFilePath = (n?: number): string => {
			const name = typeof n === 'number' ? `log_${ timeStamp }_${ n }.txt` : `log_${ timeStamp }.txt`;
			return path.join(logsPath, name);
		};

		let logPath = makeLogFilePath();
		let postfix = 0;
		while (fs.exists(logPath)) {
			logPath = makeLogFilePath(++postfix);
		}

		return logPath;
	}

	static async getLatestLogFile(): Promise<string> {
		const logsPath = this.getLogsPath();

		if (!fs.exists(logsPath)) {
			return '';
		}

		let logDirContent = await fs.dirContentStats(logsPath);

		if (logDirContent.length === 0) {
			return '';
		}

		logDirContent = this.sortFileInfosByCreationTime(logDirContent);

		return logDirContent[0].fullPath;
	}

	private static sortFileInfosByCreationTime(fileInfos: FileInformation[]): FileInformation[] {
		return fileInfos.sort((a, b) => {
			if (a.stats.birthtime === b.stats.birthtime) {
				return 0;
			}

			return a.stats.birthtime > b.stats.birthtime ? -1 : 1;
		});
	}

	static async getRecentLogs(): Promise<string> {
		const logsPath = this.getLogsPath();

		if (!fs.exists(logsPath)) {
			return '';
		}

		let files = await fs.dirContentStats(logsPath);
		files = this.sortFileInfosByCreationTime(files);

		const maxLogsSize = 5; // Mb
		const maxLogsSizeBytes = mbToB(maxLogsSize);

		const logFilesContent: string[] = [];
		let attachSize = 0;

		const reverseLogEntries = (content: string): string => {
			const EOL = '\r\n';

			return content
				.split(EOL)
				.reverse()
				.join(EOL);
		};

		for (const file of files) {
			if (attachSize >= maxLogsSizeBytes) {
				break;
			}

			const content = await fs.readFileAsync(file.fullPath);
			const reversedContent = reverseLogEntries(content);

			logFilesContent.push(reversedContent);
			attachSize += reversedContent.length;
		}

		return logFilesContent.join()
			.substr(0, maxLogsSizeBytes);
	}

	constructor(level: LogLevel) {
		super(level);

		this.maxLogFileSize = mbToB(getConfiguration().logging.file.maxFileSize);

		this.initializeWrite();

		this.messageQueue.subscribe(
			(msg) => this.writeInternal(msg),
			(err) => console.debug(err),
			() => console.debug('completed')
		);
	}

	private initializeWrite(): void {
		const logPath = FileSink.getNextLogFilePath();

		this.stream = fs.createWriteStream(logPath, { flags: 'a+' });

		this.stream.on('error', (err) => {
			console.debug(err);
			this.isReady = false;

			this.dispose();
		});

		this.isReady = true;
	}

	override write(message: LogMessage): void {
		if (this.level > message.level) {
			return;
		}

		if (!this.isReady) {
			this.messageQueue.next(message);

			return;
		}

		this.writeInternal(message);
	}

	override dispose(): void {
		this.stream?.end();
	}

	private writeInternal(message: LogMessage): void {
		if (!this.stream) {
			return;
		}

		if (this.stream.bytesWritten > this.maxLogFileSize) {
			this.isReady = false;
			this.initializeWrite();
		}

		this.stream.write(`${ message.timestamp } ${ message.body }\r\n`);

		if (message.stackTrace) {
			this.stream.write(message.stackTrace);
		}
	}
}

function mbToB(mb: number): number {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return mb * 1000 * 1000;
}
