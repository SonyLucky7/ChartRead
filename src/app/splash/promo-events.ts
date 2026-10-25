import { getDateTimestamp, getLocaleTimestamp } from '../../utils/datetime';
import { randomIntFromInterval } from '../../utils/math';

const enum SplashType {
	Regular,
	FirstApril,
	Halloween,
	BlackFriday,
	CyberMonday,
	ChristmasHolidays,
}

const enum ChristmasSplashType {
	ChristmasHolidays,
	NewYear,
}

export const enum SplashPostfix {
	AstronautIce = 'astronaut-ice',
	AstronautRover = 'astronaut-rover',
	AstronautSunset = 'astronaut-sunset',
	FirstApril = 'first-april',
	Halloween = 'halloween',
	BlackFriday = 'black-friday',
	CyberMonday = 'cyber-monday',
	ChristmasHolidays = 'christmas-holidays',
	NewYear = 'new-year',
}

interface PromoEventTimeInterval {
	beginDataTimestamp: number;
	endDataTimestamp: number;
	splashType: SplashType;
}

const FIRST_APRIL_INTERVAL: PromoEventTimeInterval = {
	beginDataTimestamp: getDateTimestamp({ year: 2024, month: 4, day: 1, hour: 0, minutes: 0, seconds: 0 }),
	endDataTimestamp: getDateTimestamp({ year: 2024, month: 4, day: 1, hour: 23, minutes: 59, seconds: 59 }),
	splashType: SplashType.FirstApril,
};

const HALLOWEEN_INTERVAL: PromoEventTimeInterval = {
	beginDataTimestamp: getDateTimestamp({ year: 2025, month: 10, day: 31, hour: 0, minutes: 0, seconds: 0 }),
	endDataTimestamp: getDateTimestamp({ year: 2025, month: 10, day: 31, hour: 23, minutes: 59, seconds: 59 }),
	splashType: SplashType.Halloween,
};

const BLACK_FRIDAY_INTERVAL: PromoEventTimeInterval = {
	beginDataTimestamp: getDateTimestamp({ year: 2025, month: 11, day: 21, hour: 0, minutes: 0, seconds: 0 }),
	endDataTimestamp: getDateTimestamp({ year: 2025, month: 11, day: 28, hour: 23, minutes: 59, seconds: 59 }),
	splashType: SplashType.BlackFriday,
};

const CYBER_MONDAY_INTERVAL: PromoEventTimeInterval = {
	beginDataTimestamp: getDateTimestamp({ year: 2025, month: 11, day: 29, hour: 0, minutes: 0, seconds: 0 }),
	endDataTimestamp: getDateTimestamp({ year: 2025, month: 12, day: 2, hour: 23, minutes: 59, seconds: 59 }),
	splashType: SplashType.CyberMonday,
};

const CHRISTMAS_HOLIDAYS_INTERVAL: PromoEventTimeInterval = {
	beginDataTimestamp: getDateTimestamp({ year: 2025, month: 12, day: 24, hour: 0, minutes: 0, seconds: 0 }),
	endDataTimestamp: getDateTimestamp({ year: 2026, month: 1, day: 1, hour: 23, minutes: 59, seconds: 59 }),
	splashType: SplashType.ChristmasHolidays,
};

const promoEventsTimeIntervals: PromoEventTimeInterval[] = [
	FIRST_APRIL_INTERVAL,
	HALLOWEEN_INTERVAL,
	BLACK_FRIDAY_INTERVAL,
	CYBER_MONDAY_INTERVAL,
	CHRISTMAS_HOLIDAYS_INTERVAL,
];

function getSplashTypeForCurrentDate(): SplashType {
	const currentDateTimestamp = getLocaleTimestamp(new Date(), 'en-Us', 'America/Los_Angeles');

	const promoEventType = promoEventsTimeIntervals.find(ev => currentDateTimestamp >= ev.beginDataTimestamp && currentDateTimestamp <= ev.endDataTimestamp);

	return promoEventType ? promoEventType.splashType : SplashType.Regular;
}

export interface SplashData {
	postfix: SplashPostfix;
	title?: 'ChartRead';
	eventTitle?: string;
}

const regularSplashPostfixes: SplashPostfix[] = [
	SplashPostfix.AstronautIce,
	SplashPostfix.AstronautRover,
	SplashPostfix.AstronautSunset,
];

const defaultSplashData: SplashData = {
	postfix: SplashPostfix.AstronautIce,
	title: 'ChartRead',
};

export function isRegularSplash(postfix: SplashPostfix): boolean {
	return regularSplashPostfixes.includes(postfix);
}

function getRegularSplashData(): SplashData {
	const postfix = regularSplashPostfixes[randomIntFromInterval(0, regularSplashPostfixes.length - 1)];

	return postfix ? { postfix, title: 'ChartRead' } : defaultSplashData;
}

function getChristmasHolidaysSplashData(): SplashData {
	const defaultChristmasHolidaysSplashData: SplashData = {
		postfix: SplashPostfix.ChristmasHolidays, title: 'ChartRead',
	};

	const ChristmasHolidaysSplashDataMap = new Map<ChristmasSplashType, SplashData>([
		[ChristmasSplashType.ChristmasHolidays, defaultChristmasHolidaysSplashData],
		[ChristmasSplashType.NewYear, { postfix: SplashPostfix.NewYear, title: 'ChartRead' }],
	]);

	return ChristmasHolidaysSplashDataMap.get(randomIntFromInterval(0, 1)) ?? defaultChristmasHolidaysSplashData;
}

const splashDataMap = new Map<SplashType, SplashData>([
	[SplashType.Regular, getRegularSplashData()],
	[SplashType.FirstApril, { postfix: SplashPostfix.FirstApril, title: 'ChartRead' }],
	[SplashType.Halloween, { postfix: SplashPostfix.Halloween, title: 'ChartRead' }],
	[SplashType.BlackFriday, { postfix: SplashPostfix.BlackFriday, title: 'ChartRead', eventTitle: 'Black Friday' }],
	[SplashType.CyberMonday, { postfix: SplashPostfix.CyberMonday, title: 'ChartRead', eventTitle: 'Cyber Monday' }],
	[SplashType.ChristmasHolidays, getChristmasHolidaysSplashData()],
]);

export function getSplashData(): SplashData {
	const splashType = getSplashTypeForCurrentDate();

	return splashDataMap.get(splashType) ?? defaultSplashData;
}
