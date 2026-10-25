import { areDateRangesEqual, DEFAULT_LINK_CHANNELS_CONFIG, isDateRange, Linkable, LinkChannelsConfig, LinkValuesTuple } from './linkable';

function filterBroadcast(values: LinkValuesTuple, channelsConfig: LinkChannelsConfig): LinkValuesTuple {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([key, value]) => {
				if (channelsConfig[key as keyof LinkValuesTuple] !== true || value === undefined) {
					return false;
				}

				if (key === 'time') {
					const shouldExcludeTime = channelsConfig.dateRange && channelsConfig.time && values.time !== undefined;
					if (shouldExcludeTime) {
						return false;
					}
				}

				return true;
			})
	);
}

export function checkForNewValues(groupState: LinkValuesTuple, newValues: LinkValuesTuple): boolean {
	for (const [key, newValue] of Object.entries(newValues)) {
		const currentValue = groupState[key as keyof LinkValuesTuple];

		if (currentValue === undefined) {
			return true;
		}

		if (key === 'dateRange' && isDateRange(currentValue) && isDateRange(newValue)) {
			if (!areDateRangesEqual(currentValue, newValue)) {
				return true;
			}
			continue;
		}

		if (currentValue !== newValue) {
			return true;
		}
	}

	return false;
}

export class Group {
	private shouldRequestInitialValues = true;
	private awaitingNewValues = false;
	private channelsConfig: LinkChannelsConfig;
	private values: LinkValuesTuple | null;

	readonly #members: Set<Linkable> = new Set();

	constructor(initialLinkValues?: LinkValuesTuple, channelsConfig?: LinkChannelsConfig) {
		this.values = initialLinkValues ?? null;
		this.channelsConfig = channelsConfig ?? DEFAULT_LINK_CHANNELS_CONFIG;
	}

	public get members(): ReadonlySet<Linkable> {
		return this.#members;
	}

	public getLinkValues(): LinkValuesTuple | null {
		return this.values;
	}

	public add(member: Linkable): void {
		this.#members.add(member);
		if (this.values === null && this.shouldRequestInitialValues) {
			this.shouldRequestInitialValues = !member.requestValuesUpdate(this.channelsConfig);
		}
		else if (this.values !== null) {
			member.onNewLinkValues(filterBroadcast(this.values, this.channelsConfig));
		}
	}

	public delete(member: Linkable): boolean {
		const deleted = this.#members.delete(member);
		if (this.empty()) {
			this.values = null;
			this.channelsConfig = DEFAULT_LINK_CHANNELS_CONFIG;
			this.shouldRequestInitialValues = true;
		}

		return deleted;
	}

	public empty(): boolean {
		return this.#members.size === 0;
	}

	public getChannelsConfig(): LinkChannelsConfig {
		return this.channelsConfig;
	}

	public setChannelsConfig(channelsConfig: LinkChannelsConfig, source: Linkable): void {
		this.channelsConfig = channelsConfig;
		this.awaitingNewValues = source.requestValuesUpdate(this.channelsConfig);
	}

	public broadcastValues(source: Linkable, values: LinkValuesTuple): void {
		const filteredValues = filterBroadcast(values, this.channelsConfig);

		if (Object.entries(filteredValues).length === 0) {
			return;
		}
		if (this.values !== null && !checkForNewValues(this.values, filteredValues) && !this.awaitingNewValues) {
			return;
		}
		this.awaitingNewValues = false;

		this.values = Object.assign(this.values ?? {}, filteredValues);

		for (const member of this.members) {
			if (member.id === source.id) {
				continue;
			}
			member.onNewLinkValues(filteredValues);
		}
	}
}
