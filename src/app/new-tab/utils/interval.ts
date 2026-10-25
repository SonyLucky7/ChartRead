import { ResolutionString } from '../../../services/new-tab';

const RESOLUTION_WITH_KIND_CHAR_REGEX = /^(\d*)([TSHDWMR])$/;
const MINUTES_RESOLUTION_REGEX = /^(\d+)$/;

export enum ResolutionKind {
	Ticks = 'ticks',
	Seconds = 'seconds',
	Minutes = 'minutes',
	Days = 'days',
	Weeks = 'weeks',
	Months = 'months',
	Range = 'range',
	Invalid = 'invalid',
}

export enum SpecialResolutionKind {
	Hours = 'hours',
}

export type GUIResolutionKind = ResolutionKind | SpecialResolutionKind;

const KIND_TO_MILLISECONDS: Record<string, number> = {};
KIND_TO_MILLISECONDS[ResolutionKind.Ticks] = 1000;
KIND_TO_MILLISECONDS[ResolutionKind.Seconds] = 1000;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
KIND_TO_MILLISECONDS[ResolutionKind.Minutes] = 60 * KIND_TO_MILLISECONDS[ResolutionKind.Seconds];
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
KIND_TO_MILLISECONDS[ResolutionKind.Days] = 24 * 60 * KIND_TO_MILLISECONDS[ResolutionKind.Minutes];
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
KIND_TO_MILLISECONDS[ResolutionKind.Weeks] = 7 * KIND_TO_MILLISECONDS[ResolutionKind.Days];

const CHAR_TO_KIND: Record<string, ResolutionKind> = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	T: ResolutionKind.Ticks,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	S: ResolutionKind.Seconds,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	D: ResolutionKind.Days,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	W: ResolutionKind.Weeks,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	M: ResolutionKind.Months,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	R: ResolutionKind.Range,
};

const intradayKinds = new Set([ResolutionKind.Ticks, ResolutionKind.Seconds, ResolutionKind.Minutes]);
export class Interval {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _kind: ResolutionKind = ResolutionKind.Invalid;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _multiplier = 0;

	public static parse(s: string): Interval {
		// comma in interval means predefined data range, drop it
		s = (s + '').toUpperCase().split(',')[0] as ResolutionString;

		let match = RESOLUTION_WITH_KIND_CHAR_REGEX.exec(s);
		if (match !== null) {
			if (match[2] === 'H') {
				// in case when we parse a string like 10H we should convert it to 10 * 60 minutes
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				return new Interval(ResolutionKind.Minutes, getMultiplier(match[1]) * 60);
			}

			return new Interval(CHAR_TO_KIND[match[2]], getMultiplier(match[1]));
		}

		match = MINUTES_RESOLUTION_REGEX.exec(s);
		if (match !== null) {
			return new Interval(ResolutionKind.Minutes, getMultiplier(match[1]));
		}

		return new Interval(ResolutionKind.Invalid, 0);
	}

	public static kind(resolution: ResolutionString): ResolutionKind {
		return Interval.parse(resolution).kind();
	}

	public static isValid(resolution: string): boolean {
		return Interval.parse(resolution).isValid();
	}

	public static isDWM(resolution: string): boolean {
		return Interval.parse(resolution).isDWM();
	}

	public static isIntraday(resolution: string): boolean {
		return Interval.parse(resolution).isIntraday();
	}

	public static isMinutes(resolution: string): boolean {
		return Interval.parse(resolution).isMinutes();
	}

	public static isMinuteHours(resolution: string): boolean {
		// 60 minutes, 120 minutes and so on
		return Interval.parse(resolution).isMinuteHours();
	}

	public static isRange(resolution: string): boolean {
		return Interval.parse(resolution).isRange();
	}

	public static isTicks(resolution: string): boolean {
		return Interval.parse(resolution).isTicks();
	}

	public constructor(kind: ResolutionKind, multiplier: number) {
		if (kind !== ResolutionKind.Invalid && multiplier > 0) {
			this._kind = kind;
			this._multiplier = multiplier;
		}
	}

	public kind(): ResolutionKind {
		return this._kind;
	}

	public multiplier(): number {
		return this._multiplier;
	}

	public isValid(): boolean {
		return this.kind() !== ResolutionKind.Invalid && this.multiplier() > 0;
	}

	public isDWM(): boolean {
		return this.isValid() && !this.isRange() && !this.isIntraday() && !this.isTicks();
	}

	public isIntraday(): boolean {
		const isIntradayKind = intradayKinds.has(this.kind());

		return this.isValid() && isIntradayKind;
	}

	public isMinutes(): boolean {
		return this.kind() === ResolutionKind.Minutes;
	}

	public isMinuteHours(): boolean {
		// 60 minutes, 120 minutes and so on
		return this.kind() === ResolutionKind.Minutes && isHour(this.multiplier());
	}

	public isRange(): boolean {
		return this.kind() === ResolutionKind.Range;
	}

	public isTicks(): boolean {
		return this.kind() === ResolutionKind.Ticks;
	}
}

function getMultiplier(s: string): number {
	if (s.length === 0) {
		return 1;
	}

	return parseInt(s, 10);
}

function isHour(interval: number): boolean {
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return interval >= 60 && !(interval % 60);
}
