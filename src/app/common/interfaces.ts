export type ToolItemName = 'Screener' | 'Heatmap' | 'News' | 'Snaps' | 'Community' | 'Economic Calendar';

export type ToolItemOptionName = 'Crypto' | 'ETF' | 'Forex' | 'Stock';

export interface ToolItemOption {
	url: string;
	title: string;
	hasMarkBeta?: boolean;
	hasMarkNew?: boolean;
}

export interface ToolItem extends ToolItemOption {
	iconSource: string;
	options?: ToolItemOption[];
	description?: string;
}

export enum NavigationKeys {
	Down = 'ArrowDown',
	Up = 'ArrowUp',
	Right = 'ArrowRight',
	Left = 'ArrowLeft',
}
