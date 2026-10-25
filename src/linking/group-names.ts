export const groupNames = [
	'Red',
	'Green',
	'Blue',
	'Yellow',
	'Orange',
	'Sky Blue',
	'Grapes Purple',
	'Rose',
	'Purple',
] as const;

export type GroupName = typeof groupNames[number];

export function getFallbackName(): GroupName {
	return 'Red';
}
