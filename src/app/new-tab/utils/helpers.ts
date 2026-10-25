import { t } from 'i18next';

import { addBreadcrumb } from '../../../sentry/renderer';
import { ResolutionString } from '../../../services/new-tab';
import { GUIResolutionKind, Interval, ResolutionKind, SpecialResolutionKind } from './interval';

interface SortItem<T> {
	item: T;
	matchPriority: MatchPriority;
	matchIndex?: number;
}

interface RegExpRule {
	fullMatch: RegExp;
	fuzzyHighlight: boolean;
	re: RegExp;
	reserveRe?: RegExp;
}

interface SortDataOptions<TSource, T> {
	data: TSource[];
	rules: RegExpRule[];
	queryString: string;
	primaryKey: T;
	isPreventedFromFiltering?: boolean;
	optionalPrimaryKey?: T;
	secondaryKey?: T;
}

interface TranslatedResolutionModel {
	multiplier: string;
	shortKind: string;
	hint: string;
	mayOmitMultiplier: boolean;
	mayOmitShortKind: boolean;
}

const enum MatchPriority {
	Low,
	Medium,
	High,
	Highest,
}

function isString(obj: any): boolean {
	if (obj === null || obj === undefined) {
		return false;
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return obj.constructor === String;
}

export function rankedSearch<T extends string, TSource extends { [K in T]?: string }>(options: SortDataOptions<TSource, T>): TSource[] {
	const { data, rules, queryString, isPreventedFromFiltering, primaryKey, secondaryKey = primaryKey, optionalPrimaryKey } = options;
	return data
		.map((item: TSource): SortItem<TSource> => {
			const primaryValue = optionalPrimaryKey && item[optionalPrimaryKey] ? item[optionalPrimaryKey] : item[primaryKey];
			const secondaryValue = item[secondaryKey];
			let matchPriority = MatchPriority.Low;
			let matchIndex: number | undefined;

			rules.forEach((rule: RegExpRule) => {
				const { re, fullMatch } = rule;
				re.lastIndex = 0;

				if (primaryValue && primaryValue.toLowerCase() === queryString.toLowerCase()) {
					matchPriority = MatchPriority.Highest;
					matchIndex = fullMatch.exec(primaryValue)?.index;
					return;
				}

				if (primaryValue && isString(primaryValue) && fullMatch.test(primaryValue)) {
					matchPriority = MatchPriority.High;

					matchIndex = fullMatch.exec(primaryValue)?.index;
					return;
				}

				if (secondaryValue && isString(secondaryValue) && fullMatch.test(secondaryValue)) {
					matchPriority = MatchPriority.Medium;
					matchIndex = fullMatch.exec(secondaryValue)?.index;
					return;
				}

				if (secondaryValue && isString(secondaryValue) && re.test(secondaryValue)) {
					matchPriority = MatchPriority.Medium;
					matchIndex = re.exec(secondaryValue)?.index;
				}
			});

			return { matchPriority, matchIndex, item };
		})
		.filter((sortItem: SortItem<TSource>) => isPreventedFromFiltering || sortItem.matchPriority)
		.sort((a: SortItem<TSource>, b: SortItem<TSource>) => {
			if (a.matchPriority < b.matchPriority) {
				return 1;
			}

			if (a.matchPriority > b.matchPriority) {
				return -1;
			}

			if (a.matchPriority === b.matchPriority) {
				if (a.matchIndex === undefined || b.matchIndex === undefined) {
					return 0;
				}

				if (a.matchIndex > b.matchIndex) {
					return 1;
				}

				if (a.matchIndex < b.matchIndex) {
					return -1;
				}
			}

			return 0;
		})
		.map(({ item }: SortItem<TSource>) => item);
}

export function createRegExpList(queryString: string, searchKeywords?: Record<string, RegExp>): RegExpRule[] {
	const rules: RegExpRule[] = [];
	const queryInLowerCase = queryString.toLowerCase();

	try {
		const reStrBody = queryString
			.split('')
			.map((character: string, index: number) => {
				const matching = index !== 0 ? `[/\\s-]${ reEscape(character) }` : reEscape(character);
				return `(${ matching })`;
			})
			.join('(.*?)') + '(.*)';

		rules.push({
			fullMatch: new RegExp(`(${ reEscape(queryString) })`, 'i'),
			re: new RegExp(`^${ reStrBody }`, 'i'),
			reserveRe: new RegExp(reStrBody, 'i'),
			fuzzyHighlight: true,
		});
	}
	catch (err) {
		addBreadcrumb({ level: 'warning', breadcrumb: `Suspicious search input of layout: ${ queryString }` });
		throw err;
	}

	if (searchKeywords && Object.prototype.hasOwnProperty.call(searchKeywords, queryInLowerCase)) {
		rules.push({
			fullMatch: searchKeywords[queryInLowerCase],
			re: searchKeywords[queryInLowerCase],
			fuzzyHighlight: false,
		});
	}

	return rules;
}

export function reEscape(str: string): string {
	return str.replace(/[?!-/[-^{-}]/g, '\\$&');
}

const resolutionSuffix: Record<GUIResolutionKind, string> = {
	[ResolutionKind.Invalid]: '',
	[ResolutionKind.Ticks]: t('T'),
	[ResolutionKind.Seconds]: t('s'),
	[ResolutionKind.Minutes]: t('m'),
	[SpecialResolutionKind.Hours]: t('h'),
	[ResolutionKind.Days]: t('D'),
	[ResolutionKind.Weeks]: t('W'),
	[ResolutionKind.Months]: t('M'),
	[ResolutionKind.Range]: t('R'),
};

function postfix(kind: GUIResolutionKind, value?: number): string {
	if (!value) {
		return resolutionSuffix[kind];
	}

	switch (kind) {
		case ResolutionKind.Ticks: return t('tick');
		case ResolutionKind.Days: return t('day');
		case ResolutionKind.Weeks: return t('week');
		case ResolutionKind.Months: return t('month');
		case ResolutionKind.Seconds: return t('second');
		case ResolutionKind.Minutes: return t('minute');
		case SpecialResolutionKind.Hours: return t('hour');
		case ResolutionKind.Range: return t('range');
		default: return kind;
	}
}

function getTranslatedResolutionModel(resolution: ResolutionString): TranslatedResolutionModel {
	const intervalObject = Interval.parse(resolution);
	let multiplier = intervalObject.multiplier();
	let kind: GUIResolutionKind = intervalObject.kind();

	if (!intervalObject.isValid()) {
		throw new TypeError('Can\'t translate invalid interval');
	}

	if (intervalObject.isMinuteHours()) {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		multiplier = Math.floor(multiplier / 60);
		kind = SpecialResolutionKind.Hours;
	}

	return {
		multiplier: multiplier.toString(),
		shortKind: postfix(kind),
		hint: `${ multiplier } ${ postfix(kind, multiplier) }`,
		mayOmitMultiplier: intervalObject.isDWM() && multiplier === 1,
		mayOmitShortKind: intervalObject.isMinutes() && !intervalObject.isMinuteHours(),
	};
}

export function getTranslatedResolution(resolution: ResolutionString): string {
	const { multiplier, shortKind } = getTranslatedResolutionModel(resolution);
	return `${ multiplier }${ shortKind }`;
}
