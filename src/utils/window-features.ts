import { Tagged } from 'type-fest';

export type Name = Tagged<string, 'Name'>;
export type Value = Tagged<string, 'Value'>;
export type TokenizedFeatures = Map<Name, Value>;

/**
 * The window-features module implements `window.open` windowFeatures parsing based on HTML standard spec
 * https://html.spec.whatwg.org/multipage/nav-history-apis.html#concept-window-open-features-tokenize
 */

export function parse(windowFeatures: string): TokenizedFeatures {
	const featureMap = new Map<Name, Value>([]);

	if (windowFeatures === '') {
		return featureMap;
	}

	const featureList = windowFeatures.split(',');

	if (featureList.length > 0) {
		featureList.forEach((feature) => {
			const [nameString, valueString] = feature.split('=');

			const name = tryMakeName(nameString);

			if (name === null) {
				return;
			}

			featureMap.set(
				name,
				makeValue(valueString ?? '')
			);
		});
	}

	return featureMap;
}

export function tryMakeName(nameString: string): Name | null {
	const nameStringTrimmed = nameString.trim();

	if (nameStringTrimmed === '') {
		return null;
	}

	return normalizeName(nameStringTrimmed.toLowerCase() as Name);
}

export function makeValue(valueString: string): Value {
	return valueString.trim().toLowerCase() as Value;
}

export function parseBase10Int(value: Value): number | null {
	const parsedInt = Number.parseInt(value, 10);

	if (Number.isNaN(parsedInt)) {
		return null;
	}

	// '-0' parses into -0 number and in tests -0 number is not equal to 0 number
	// idk if it matters but just in case this solves -0:
	return parsedInt + 0;
}

/**
 * the rules for the boolean parsing in getBoolean is according to:
 * https://html.spec.whatwg.org/multipage/nav-history-apis.html#concept-window-open-features-parse-boolean
 */
export function parseBoolean(value: Value): boolean {
	if (['', 'yes', 'true'].includes(value)) {
		return true;
	}

	const parsedInt = parseBase10Int(value) ?? 0;

	return Boolean(parsedInt);
}

const enum LegacyFeatureNameAlias {
	Width = 'innerwidth',
	Height = 'innerheight',
	Left = 'screenx',
	Top = 'screeny',
}

const enum NormalizedFeatureName {
	Width = 'width',
	Height = 'height',
	Left = 'left',
	Top = 'top',
}

function normalizeName(name: Name): Name {
	switch (name) {
		case LegacyFeatureNameAlias.Width: {
			return NormalizedFeatureName.Width as Name;
		}
		case LegacyFeatureNameAlias.Height: {
			return NormalizedFeatureName.Height as Name;
		}
		case LegacyFeatureNameAlias.Top: {
			return NormalizedFeatureName.Top as Name;
		}
		case LegacyFeatureNameAlias.Left: {
			return NormalizedFeatureName.Left as Name;
		}
		default: {
			return name;
		}
	}
}
