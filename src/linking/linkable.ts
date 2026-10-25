import { GroupName } from './group-names';

export type LinkValues = {
	symbol: string;
	interval: string;
	time: number;
	dateRange: {
		startTime: number;
		endTime: number;
	};
};

type DateRange = LinkValues['dateRange'];

export const isDateRange = (val: unknown): val is DateRange =>
	typeof val === 'object' && val !== null &&
	'startTime' in val && typeof val.startTime === 'number' &&
	'endTime' in val && typeof val.endTime === 'number';

export function areDateRangesEqual(dateRange1: DateRange, dateRange2: DateRange): boolean {
	return dateRange1.startTime === dateRange2.startTime && dateRange1.endTime === dateRange2.endTime;
}

export type LinkValuesTuple = Partial<LinkValues>;
export type LinkChannel = keyof LinkValues;
export type LinkChannelsConfig = Record<LinkChannel, boolean>;

export const DEFAULT_LINK_CHANNELS_CONFIG: LinkChannelsConfig = {
	symbol: true,
	interval: false,
	time: false,
	dateRange: false,
};

export const LINK_CHANNELS_CONFIG_LINKING_OFF: LinkChannelsConfig = {
	symbol: false,
	interval: false,
	time: false,
	dateRange: false,
};

export function createLinkChannelsConfig(partialConfig: Partial<LinkChannelsConfig>): LinkChannelsConfig {
	return { ...LINK_CHANNELS_CONFIG_LINKING_OFF, ...partialConfig };
}

export interface Linkable {
	id: string;
	onLinkGroupChange(groupName: GroupName | null): void;
	onNewLinkValues(values: LinkValuesTuple): void;
	requestValuesUpdate(channels: LinkChannelsConfig): boolean;
}
