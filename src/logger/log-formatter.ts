import { getTimestamp } from '../utils/datetime';
import { isTVHostedUrl } from '../utils/tv-uri';
import { ILogFormatter, LogLevel, LogMessage } from './ilogger-service';

export class LogFormatter implements ILogFormatter {
	format(message: string, logLevel: LogLevel, err?: unknown): LogMessage {
		const stackTrace = err instanceof Error ? err.stack : undefined;

		const timestamp = getTimestamp();
		const timestampLength = 25;

		return {
			timestamp: timestamp.padEnd(timestampLength),
			level: logLevel,
			body: this.composeBody(logLevel, message),
			stackTrace,
		};
	}

	private composeBody(level: LogLevel, message: string): string {
		const levelStrMap = new Map<LogLevel, string>([
			[LogLevel.Debug, 'DBG'],
			[LogLevel.Info, 'INF'],
			[LogLevel.Warn, 'WRN'],
			[LogLevel.Error, 'ERR'],
		]);

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return `[${ levelStrMap.get(level) }] ${ message }`;
	}
}

export function shortifyId(id?: string): string {
	if (!id) {
		return '';
	}

	if (!id.length) {
		return id;
	}

	return id.split('-')[0];
}

export function shortifyUrl(url?: string): string {
	if (!url) {
		return '';
	}

	if (isTVHostedUrl(url)) {
		return url;
	}

	// eslint-disable-next-line no-useless-escape
	const formatUrl = url.split('?')[0].replace(/^(?:file\:\/\/)/, '');
	let dir = __dirname;
	dir += '/';

	if (formatUrl.includes(__dirname)) {
		return formatUrl.replace(__dirname, '');
	}

	if (dir.includes('\\')) {
		dir = dir.replace(/\\/gm, '/');
	}

	const dirUri = encodeURIComponent(dir);

	if (formatUrl.includes(dirUri)) {
		return formatUrl.replace(dirUri, '');
	}

	const folders = dir.split('/')?.filter(folder => !!folder);
	dir = folders[folders.length - 1] ?? '';

	if (formatUrl.includes(dir)) {
		return formatUrl.split(dir)?.at(-1) ?? formatUrl;
	}

	return formatUrl;
}
