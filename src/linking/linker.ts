import { logCallName } from '../logger/log-decorator';
import { AttachPersistentRoot, IPersistentObjectImplementation, persistenceService, PersistentObject } from '../persistence';
import { getFallbackName, GroupName, groupNames } from './group-names';
import { GroupsManager } from './groups-manager';
import {
	createLinkChannelsConfig,
	Linkable,
	LinkChannelsConfig,
	LinkValuesTuple,
} from './linkable';

export interface LinkingService {
	assignGroup(id: string, groupName: GroupName): boolean;
	linkToSameGroup(leadingId: string, followingId: string): boolean;
	unassignGroup(id: string): void;
	getGroupName(id: string): GroupName | null;
	getGroupChannelsConfig(groupName: GroupName): LinkChannelsConfig;
	applyGroupChannelsConfig(id: string, partialConfig: Partial<LinkChannelsConfig>): void;
}

export interface LinkingController {
	registerLinkable(linkable: Linkable): void;
	unregisterLinkable(linkable: Linkable): void;
	notifyValuesChange(source: Linkable, values: LinkValuesTuple): void;
}

// 'objectIds' and 'color' field names are kept for backward compatibility
export interface GroupState {
	objectIds: string[];
	channels?: LinkChannelsConfig;
	values?: LinkValuesTuple;
}

export type GroupEntry = {
	color: GroupName;
	state: GroupState;
};

interface LinkerState {
	groups: GroupEntry[];
}

@AttachPersistentRoot('linking')
@PersistentObject
@logCallName('Linker')
export class Linker implements LinkingService, LinkingController, IPersistentObjectImplementation {
	private linkableRegistry: Map<string, Linkable> = new Map();
	private groupsManager: GroupsManager = new GroupsManager();

	public registerLinkable(linkable: Linkable): void {
		this.linkableRegistry.set(linkable.id, linkable);
	}

	public unregisterLinkable(linkable: Linkable): void {
		this.linkableRegistry.delete(linkable.id);
		this.groupsManager.deleteMember(linkable);
	}

	public notifyValuesChange(source: Linkable, values: LinkValuesTuple): void {
		this.groupsManager.getGroupByMember(source)?.broadcastValues(source, values);
	}

	public applyGroupChannelsConfig(source: string, partialConfig: Partial<LinkChannelsConfig>): void {
		const linkable = this.linkableRegistry.get(source);
		if (linkable !== undefined) {
			this.groupsManager.getGroupByMember(linkable)?.setChannelsConfig(createLinkChannelsConfig(partialConfig), linkable);
		}
	}

	public assignGroup(id: string, groupName: GroupName): boolean {
		const linkable = this.linkableRegistry.get(id);
		if (linkable === undefined) {
			return false;
		}

		this.groupsManager.addMember(groupName, linkable);
		return true;
	}

	public linkToSameGroup(leadingId: string, followingId: string): boolean {
		const leadingLinkable = this.linkableRegistry.get(leadingId);
		const followingLinkable = this.linkableRegistry.get(followingId);
		if (leadingLinkable === undefined || followingLinkable === undefined) {
			return false;
		}

		let groupName = this.groupsManager.getGroupNameByMember(leadingLinkable);
		if (groupName === null) {
			groupName = this.getNextUnusedGroupName();
			this.groupsManager.addMember(groupName, leadingLinkable);
		}
		this.groupsManager.addMember(groupName, followingLinkable);

		return true;
	}

	public unassignGroup(id: string): void {
		const linkable = this.linkableRegistry.get(id);
		if (linkable !== undefined) {
			this.groupsManager.deleteMember(linkable);
		}
	}

	public getGroupName(id: string): GroupName | null {
		const linkable = this.linkableRegistry.get(id);
		if (linkable === undefined) {
			return null;
		}

		return this.groupsManager.getGroupNameByMember(linkable);
	}

	public getGroupChannelsConfig(groupName: GroupName): LinkChannelsConfig {
		return this.groupsManager.getGroupByName(groupName).getChannelsConfig();
	}

	private getNextUnusedGroupName(fallbackGroupName: GroupName = getFallbackName()): GroupName {
		const nextUnusedGroupName = groupNames.find((groupName) => {
			return !this.groupsManager.hasMembersInGroup(groupName);
		});

		return nextUnusedGroupName ?? fallbackGroupName;
	}

	private getReadonlyLinkableRegistry(): ReadonlyMap<string, Linkable> {
		return this.linkableRegistry;
	}

	public internalExtractState(): LinkerState {
		const groups = this.filterTimeAndDateRangeFromGroups(
			this.groupsManager.getGroupEntriesSnapshot()
		);

		return { groups };
	}

	public internalApplyState(state: LinkerState): Promise<void> | void {
		const stateRestoreSubscription = persistenceService().stateRestored.subscribe(() => {
			this.groupsManager.restoreFromGroupEntriesSnapshot(
				this.filterTimeAndDateRangeFromGroups(state.groups),
				this.getReadonlyLinkableRegistry(),
			);
			stateRestoreSubscription.unsubscribe();
		});
	}

	private filterTimeAndDateRangeFromGroups(groups: GroupEntry[]): GroupEntry[] {
		return groups.map((groupEntry) => {
			const filteredValues = Object.entries(groupEntry.state.values ?? {})
				.filter(([key]) => key !== 'time' && key !== 'dateRange');

			return {
				...groupEntry,
				state: {
					...groupEntry.state,
					values: filteredValues.length > 0
						? Object.fromEntries(filteredValues)
						: undefined,
				},
			};
		});
	}
}
