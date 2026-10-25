import { TabTitleState } from '../../services/settings/tab-title-interfaces';

export type DelimiterPosition = {
	before: boolean;
	after: boolean;
}

export function delimiterPosition(visibleTitleParts: TabTitleState[]): DelimiterPosition {
	const defaultPosition: DelimiterPosition = {
		before: false,
		after: false,
	};

	const layoutNameIndex = visibleTitleParts.findIndex(i => i.id === 'layoutName');
	if (layoutNameIndex < 0) {
		return defaultPosition;
	}

	if (visibleTitleParts.length === 1) {
		return defaultPosition;
	}

	const canInsertDelimiter = (part: TabTitleState | undefined): boolean => {
		if (!part) {
			return false;
		}

		return part.id !== 'priceChangeIcon' && part.id !== 'symbolLogo';
	};

	const prevPart = visibleTitleParts[layoutNameIndex - 1];
	const nextPart = visibleTitleParts[layoutNameIndex + 1];

	return {
		before: canInsertDelimiter(prevPart),
		after: canInsertDelimiter(nextPart),
	};
}
