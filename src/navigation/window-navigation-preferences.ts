import { loggerService } from '../logger';
import { windowFeatures } from '../utils';

export interface ContentSize {
	width: number;
	height: number;
}

export interface WindowPreferences {
	contentSize?: ContentSize;
	left?: number;
	top?: number;
}

interface WindowNavigationPreferences extends WindowPreferences {
	openExternal: boolean;
	newWindow: boolean;
	link: boolean;
}
export default WindowNavigationPreferences;

export function getDefault(): WindowNavigationPreferences {
	return {
		openExternal: false,
		newWindow: false,
		link: false,
	};
}

enum SupportedWindowFeature {
	// TVD custom
	Window = 'tradingview:window',
	OpenExternal = 'openexternal',
	Link = 'tradingview:link',

	// standart window.open features
	Width = 'width',
	Height = 'height',
	Left = 'left',
	Top = 'top',
}

interface ParsedContentSize {
	width?: number;
	height?: number;
}

export function getFromWindowFeatures(windowFeaturesStr: string, defaults: WindowNavigationPreferences = getDefault()): WindowNavigationPreferences {
	const windowFeaturesMap = windowFeatures.parse(windowFeaturesStr);

	const parsedFeatures = structuredClone(defaults);
	const parsedContentSize: ParsedContentSize = {};

	for (const [name, value] of windowFeaturesMap) {
		switch (name) {
			case SupportedWindowFeature.Window: {
				parsedFeatures.newWindow = windowFeatures.parseBoolean(value);
				break;
			}
			case SupportedWindowFeature.OpenExternal: {
				parsedFeatures.openExternal = windowFeatures.parseBoolean(value);
				break;
			}
			case SupportedWindowFeature.Link: {
				parsedFeatures.link = windowFeatures.parseBoolean(value);
				break;
			}
			case SupportedWindowFeature.Left: {
				const parsedValue = windowFeatures.parseBase10Int(value);
				if (parsedValue !== null) {
					parsedFeatures.left = parsedValue;
				}
				break;
			}
			case SupportedWindowFeature.Top: {
				const parsedValue = windowFeatures.parseBase10Int(value);
				if (parsedValue !== null) {
					parsedFeatures.top = parsedValue;
				}
				break;
			}
			case SupportedWindowFeature.Width: {
				const parsedValue = windowFeatures.parseBase10Int(value);
				if (parsedValue !== null) {
					parsedContentSize.width = parsedValue;
				}
				break;
			}
			case SupportedWindowFeature.Height: {
				const parsedValue = windowFeatures.parseBase10Int(value);
				if (parsedValue !== null) {
					parsedContentSize.height = parsedValue;
				}
				break;
			}
			default: {
				loggerService().info(`window.open windowFeatures "${ name }" feature is not supported, attempted value is "${ value }"`);
			}
		}
	}

	const contentSize = tryMakeContentSize(parsedContentSize);
	if (contentSize != null) {
		parsedFeatures.contentSize = contentSize;
	}

	return parsedFeatures;
}

/**
 * Resulting contentSize must have both width and height
 * @param parsedContentSize can be partially defined
 */
function tryMakeContentSize(parsedContentSize: ParsedContentSize): ContentSize | null {
	if (parsedContentSize.height !== undefined && parsedContentSize.width !== undefined) {
		return {
			height: parsedContentSize.height,
			width: parsedContentSize.width,
		};
	}

	return null;
}
