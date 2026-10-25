interface TimestampDate {
	year: number;
	month: number;
	day: number;
	hour: number;
	minutes: number;
	seconds: number;
}

export function getTimestamp(separator?: string): string {
	const now = new Date();

	const [year, month, day, hr, min, sec, msec] = [
		now.getFullYear().toString(),
		normalizeMonth(now.getMonth()),
		stringifyNumber(now.getDate()),
		stringifyNumber(now.getHours()),
		stringifyNumber(now.getMinutes()),
		stringifyNumber(now.getSeconds()),
		stringifyNumber(now.getMilliseconds()),
	];

	if (!separator) {
		return `${ year }-${ month }-${ day } ${ hr }:${ min }:${ sec }.${ msec }`;
	}

	return [year, month, day, hr, min, sec, msec].join(separator);
}

export function normalizeMonth(month: number): string {
	month++;
	return stringifyNumber(month);
}

export function stringifyNumber(num: number): string {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return num < 10 ? `0${ num }` : `${ num }`;
}

export function getDateTimestamp({ year, month, day, hour, minutes, seconds }: TimestampDate): number {
	let timestamp: number;

	try {
		timestamp = new Date(year, month - 1, day, hour, minutes, seconds).getTime();
		return timestamp;
	}
	catch (err) {
		console.log(err);
		throw new Error('Date timestamp not created');
	}
}

export function getLocaleTimestamp(date: Date, locale: Intl.LocalesArgument, timeZone: string): number {
	try {
		const dateStringInPST = date.toLocaleString(locale, { timeZone });

		const dateInPSTTimestamp = Date.parse(dateStringInPST);

		return dateInPSTTimestamp;
	}
	catch (err) {
		console.log(err);
		throw new Error('Locale timestamp not created');
	}
}
