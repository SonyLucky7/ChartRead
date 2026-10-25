import { loggerService } from '../logger';
import { logCall, logCallName } from '../logger/log-decorator';
import { AttachPersistentRoot, IPersistentObjectImplementation, PersistentObject } from '../persistence';
import { Tab, TabState } from '../services/window/tab/tab';
import { createTabState, TvTab } from '../services/window/tab/tv-tab';
import { WindowId } from '../services/window/tabbed-window';
import { CreateTabOptions } from '../services/window/window-api';
import { getUID } from '../tvd-runtime/core';

export type DefaultTabGroupId = WindowId;
export type UserTabGroupId = string;
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
export type TabGroupId = DefaultTabGroupId | UserTabGroupId;
export type TabId = string;

interface MutableTabGroup {
	readonly id: TabGroupId;
	readonly tabIds: TabId[];
}

interface MutableDefaultTabGroup extends MutableTabGroup {}

interface MutableUserTabGroup extends MutableTabGroup {
	name: string;
	windowId: WindowId | null;
}

export interface DefaultTabGroup extends Readonly<Omit<MutableDefaultTabGroup, 'tabIds'>> {
	readonly tabIds: ReadonlyArray<TabId>;
}

export interface UserTabGroup extends Readonly<Omit<MutableUserTabGroup, 'tabIds'>> {
	readonly tabIds: ReadonlyArray<TabId>;
}

export type TabGroup = DefaultTabGroup | UserTabGroup;

interface TabGroupState {
	tabs: TabState[];
}

interface DefaultTabGroupState extends TabGroupState {}

interface UserTabGroupState extends TabGroupState {
	name: string;
}

interface TabManagerState {
	default: Record<DefaultTabGroupId, DefaultTabGroupState>;
	user: Record<UserTabGroupId, UserTabGroupState>;
}

export interface ITabManager {
	// tab operations
	resetState(): Promise<void>;
	createTab(options: CreateTabOptions, groupId: TabGroupId): Tab;
	assignTabToGroup(tabId: TabId, groupId: TabGroupId, position?: number): void;
	unassignTabFromGroup(tabId: TabId): void;
	closeTab(tabId: TabId): void;
	getTab(tabId: TabId): Tab | null;
	getDefaultGroupTabs(groupId: DefaultTabGroupId): Tab[];
	getUserGroupTabs(groupId: UserTabGroupId): Tab[];
	reorderTabInGroup(groupId: TabGroupId, oldIndex: number, newIndex: number): void;
	disposeOrphanedTabs(): void;
	// group operations
	createDefaultGroup(groupId: DefaultTabGroupId): DefaultTabGroupId;
	getDefaultGroups(): DefaultTabGroup[];
	getDefaultGroup(groupId: DefaultTabGroupId): DefaultTabGroup | null;
	deleteDefaultGroup(groupId: DefaultTabGroupId): void;
	createUserGroup(name: string): UserTabGroupId;
	renameUserGroup(groupId: UserTabGroupId, name: string): void;
	getUserGroups(): UserTabGroup[];
	getUserGroup(groupId: UserTabGroupId): UserTabGroup | null;
	deleteUserGroup(groupId: UserTabGroupId): void;
	deactivateGroup(groupId: TabGroupId): Promise<void>;
	getGroupForTab(tabId: TabId): TabGroup | null;
	// window - group assignment
	resetUserGroupWindowAssignment(windowId: WindowId): void;
}

export const MAX_USER_GROUPS = 10;
export const MAX_GROUP_NAME_LENGTH = 64;

@AttachPersistentRoot('tabs')
@PersistentObject
@logCallName('TabManager')
export class TabManager implements ITabManager, IPersistentObjectImplementation {
	private readonly tabRegistry: Map<TabId, Tab> = new Map();

	private readonly groupRegistryDefault: Map<DefaultTabGroupId, MutableDefaultTabGroup> = new Map();
	private readonly groupRegistryUser: Map<UserTabGroupId, MutableUserTabGroup> = new Map();

	private readonly tabToGroup: Map<TabId, TabGroupId> = new Map();

	// -- Persistence --

	public internalExtractState(): TabManagerState {
		const defaultGroupState: Record<DefaultTabGroupId, DefaultTabGroupState> = {};
		const userGroupState: Record<UserTabGroupId, UserTabGroupState> = {};

		for (const defaultGroup of this.groupRegistryDefault.values()) {
			const tabs: TabState[] = defaultGroup.tabIds
				.map((id) => this.tabRegistry.get(id)?.state)
				.filter((state) => state !== undefined);

			defaultGroupState[defaultGroup.id] = {
				tabs,
			};
		}

		for (const userGroup of this.groupRegistryUser.values()) {
			const tabs: TabState[] = userGroup.tabIds
				.map((id) => this.tabRegistry.get(id)?.state)
				.filter((state) => state !== undefined);

			userGroupState[userGroup.id] = {
				tabs,
				name: userGroup.name,
			};
		}

		return { default: defaultGroupState, user: userGroupState };
	}

	public internalApplyState(state: TabManagerState): void {
		for (const [defaultGroupId, defaultGroupState] of Object.entries(state.default)) {
			const defaultGroup: MutableDefaultTabGroup = {
				id: defaultGroupId,
				tabIds: defaultGroupState.tabs.map((tabState) => tabState.persistentId),
			};

			for (const tabState of defaultGroupState.tabs) {
				const tab = TvTab.createTab(tabState);

				this.tabRegistry.set(tab.id, tab);
				this.tabToGroup.set(tab.id, defaultGroup.id);
			}

			this.groupRegistryDefault.set(defaultGroup.id, defaultGroup);

			loggerService().info(`TabManager.internalApplyState: restored default group (${ defaultGroup.id }), ${ defaultGroup.tabIds.length } tabs`);
		}

		for (const [userGroupId, userGroupState] of Object.entries(state.user)) {
			const userGroup: MutableUserTabGroup = {
				id: userGroupId,
				name: userGroupState.name,
				tabIds: userGroupState.tabs.map((tabState) => tabState.persistentId),
				windowId: null,
			};

			for (const tabState of userGroupState.tabs) {
				const tab = TvTab.createTab(tabState);

				this.tabRegistry.set(tab.id, tab);
				this.tabToGroup.set(tab.id, userGroup.id);
			}

			this.groupRegistryUser.set(userGroup.id, userGroup);

			loggerService().info(`TabManager.internalApplyState: restored user group '${ userGroup.name }' (${ userGroup.id }), ${ userGroup.tabIds.length } tabs`);
		}
	}

	// -- Tab operations --

	@logCall
	public async resetState(): Promise<void> {
		const tabs = [...this.tabRegistry.values()];

		this.tabRegistry.clear();
		this.groupRegistryDefault.clear();
		this.groupRegistryUser.clear();
		this.tabToGroup.clear();

		await Promise.allSettled(
			tabs.map(async(tab) => {
				try {
					await tab.dispose();
				}
				catch (error) {
					loggerService().error(`TabManager.resetState: tab.dispose(id: ${ tab.id }) error`, error);
				}
			})
		);
	}

	@logCall
	public createTab(options: CreateTabOptions, groupId: TabGroupId): Tab {
		const group = this.getGroup(groupId);
		if (group === null) {
			throw new Error(`TabManager.createTab: group ${ groupId } was not found`);
		}

		const tabState = createTabState(options);
		const tab = TvTab.createTab(tabState);

		this.tabRegistry.set(tab.id, tab);
		this.tabToGroup.set(tab.id, group.id);

		const position = this.computeInsertPosition(group, Boolean(options.pinned), options.position);
		group.tabIds.splice(position, 0, tab.id);

		loggerService().info(`TabManager.createTab: created tab ${ tab.id } in group ${ group.id } at position ${ position }`);

		return tab;
	}

	@logCall
	public assignTabToGroup(tabId: TabId, groupId: TabGroupId, position?: number): void {
		const tab = this.tabRegistry.get(tabId);
		if (tab === undefined) {
			throw new Error(`TabManager.assignTabToGroup: tab ${ tabId } was not found`);
		}

		const group = this.getGroup(groupId);
		if (group === null) {
			throw new Error(`TabManager.assignTabToGroup: group ${ groupId } was not found`);
		}

		if (this.tabToGroup.has(tab.id)) {
			loggerService().warn(`TabManager.assignTabToGroup: tab ${ tab.id } is already assigned to a group`);
			return;
		}

		const insertPosition = this.computeInsertPosition(group, tab.pinned, position);
		group.tabIds.splice(insertPosition, 0, tab.id);
		this.tabToGroup.set(tab.id, group.id);

		loggerService().info(`TabManager.assignTabToGroup: assigned tab ${ tab.id } to group ${ group.id } at position ${ insertPosition }`);
	}

	@logCall
	public unassignTabFromGroup(tabId: TabId): void {
		if (!this.tabRegistry.has(tabId)) {
			throw new Error(`TabManager.unassignTabFromGroup: tab ${ tabId } was not found`);
		}

		const groupId = this.tabToGroup.get(tabId);
		if (groupId === undefined) {
			throw new Error(`TabManager.unassignTabFromGroup: tab ${ tabId } is not currently in any group`);
		}

		const group = this.getGroup(groupId);
		if (group === null) {
			throw new Error(`TabManager.unassignTabFromGroup: group ${ groupId } was not found`);
		}

		const index = group.tabIds.indexOf(tabId);
		if (index !== -1) {
			group.tabIds.splice(index, 1);
		}

		this.tabToGroup.delete(tabId);

		loggerService().info(`TabManager.unassignTabFromGroup: unassigned tab ${ tabId } from group ${ groupId }`);
	}

	@logCall
	public closeTab(tabId: TabId): void {
		const tab = this.tabRegistry.get(tabId);
		if (tab === undefined) {
			loggerService().warn(`TabManager.closeTab: tab ${ tabId } was not found`);
			return;
		}

		const groupId = this.tabToGroup.get(tabId);
		if (groupId !== undefined) {
			const group = this.getGroup(groupId);
			if (group !== null) {
				const index = group.tabIds.indexOf(tabId);
				if (index !== -1) {
					group.tabIds.splice(index, 1);
				}
			}
		}

		this.tabRegistry.delete(tabId);
		this.tabToGroup.delete(tabId);

		tab.dispose();

		loggerService().info(`TabManager.closeTab: removed and disposed tab ${ tabId }`);
	}

	@logCall
	public getTab(tabId: TabId): Tab | null {
		return this.tabRegistry.get(tabId) ?? null;
	}

	public getDefaultGroupTabs(groupId: DefaultTabGroupId): Tab[] {
		const group = this.groupRegistryDefault.get(groupId);
		if (group === undefined) {
			loggerService().warn(`TabManager.getDefaultGroupTabs: default group ${ groupId } was not found`);
			return [];
		}

		return group.tabIds
			.map((id) => this.tabRegistry.get(id))
			.filter((tab) => tab !== undefined);
	}

	public getUserGroupTabs(groupId: UserTabGroupId): Tab[] {
		const group = this.groupRegistryUser.get(groupId);
		if (group === undefined) {
			loggerService().warn(`TabManager.getUserGroupTabs: user group ${ groupId } was not found`);
			return [];
		}

		return group.tabIds
			.map((id) => this.tabRegistry.get(id))
			.filter((tab) => tab !== undefined);
	}

	@logCall
	public reorderTabInGroup(groupId: TabGroupId, oldIndex: number, newIndex: number): void {
		const group = this.getGroup(groupId);
		if (group === null) {
			throw new Error(`TabManager.reorderTabInGroup: group ${ groupId } was not found`);
		}

		if (
			oldIndex < 0 ||
			oldIndex >= group.tabIds.length ||
			newIndex < 0 ||
			newIndex >= group.tabIds.length
		) {
			throw new Error(`TabManager.reorderTabInGroup: index out of bounds (old=${ oldIndex }, new=${ newIndex }, length=${ group.tabIds.length })`);
		}

		const [tabId] = group.tabIds.splice(oldIndex, 1);
		group.tabIds.splice(newIndex, 0, tabId);
	}

	@logCall
	public disposeOrphanedTabs(): void {
		const orphanIds: TabId[] = [];
		for (const tabId of this.tabRegistry.keys()) {
			if (!this.tabToGroup.has(tabId)) {
				orphanIds.push(tabId);
			}
		}

		for (const tabId of orphanIds) {
			const tab = this.tabRegistry.get(tabId);
			if (tab === undefined) {
				continue;
			}

			loggerService().warn(`TabManager.disposeOrphanedTabs: disposing orphaned tab ${ tabId }`);
			this.tabRegistry.delete(tabId);

			try {
				tab.dispose();
			}
			catch (error) {
				loggerService().error(`TabManager.disposeOrphanedTabs: tab.dispose(id: ${ tabId }) error`, error);
			}
		}
	}

	// -- Group operations --

	@logCall
	public createDefaultGroup(groupId: DefaultTabGroupId): DefaultTabGroupId {
		const existing = this.groupRegistryDefault.get(groupId);
		if (existing !== undefined) {
			loggerService().warn(`TabManager.createDefaultGroup: Default group already exists for window ${ groupId }`);
			return existing.id;
		}

		const group: MutableDefaultTabGroup = {
			id: groupId,
			tabIds: [],
		};

		this.groupRegistryDefault.set(group.id, group);

		loggerService().info(`TabManager.createDefaultGroup: created group ${ group.id } for window ${ groupId }`);

		return group.id;
	}

	@logCall
	public getDefaultGroups(): DefaultTabGroup[] {
		return Array.from(this.groupRegistryDefault.values());
	}

	@logCall
	public getDefaultGroup(groupId: DefaultTabGroupId): DefaultTabGroup | null {
		return this.groupRegistryDefault.get(groupId) ?? null;
	}

	@logCall
	public deleteDefaultGroup(groupId: DefaultTabGroupId): void {
		const group = this.groupRegistryDefault.get(groupId);
		if (group === undefined) {
			loggerService().warn(`TabManager.deleteDefaultGroup: group ${ groupId } was not found`);
			return;
		}

		const closedTabIds = [...group.tabIds];

		for (const tabId of closedTabIds) {
			this.closeTab(tabId);
		}

		this.groupRegistryDefault.delete(group.id);

		loggerService().info(`TabManager.deleteDefaultGroup: deleted Default group for window ${ group.id }`);
	}

	@logCall
	public createUserGroup(name: string): UserTabGroupId {
		if (this.groupRegistryUser.size >= MAX_USER_GROUPS) {
			throw new Error(`TabManager.createUserGroup: cannot create more than ${ MAX_USER_GROUPS } user groups`);
		}

		const trimmedName = name.trim();
		if (trimmedName === '') {
			throw new Error('TabManager.createUserGroup: name cannot be empty');
		}

		if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
			throw new Error(`TabManager.createUserGroup: name exceeds max length (${ MAX_GROUP_NAME_LENGTH })`);
		}

		const isDuplicate = Array.from(this.groupRegistryUser.values())
			.some((existingGroup) => existingGroup.name === trimmedName);

		if (isDuplicate) {
			throw new Error(`TabManager.createUserGroup: user group with name "${ trimmedName }" already exists`);
		}

		const group: MutableUserTabGroup = {
			id: getUID(),
			name: trimmedName,
			tabIds: [],
			windowId: null,
		};

		this.groupRegistryUser.set(group.id, group);

		loggerService().info(`TabManager.createUserGroup: created user group "${ trimmedName }" (${ group.id })`);

		return group.id;
	}

	@logCall
	public renameUserGroup(groupId: UserTabGroupId, name: string): void {
		const group = this.groupRegistryUser.get(groupId);
		if (group === undefined) {
			throw new Error(`TabManager.renameUserGroup: user group ${ groupId } was not found`);
		}

		const trimmedName = name.trim();
		if (trimmedName === '') {
			throw new Error('TabManager.renameUserGroup: name cannot be empty');
		}

		if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
			throw new Error(`TabManager.renameUserGroup: name exceeds max length (${ MAX_GROUP_NAME_LENGTH })`);
		}

		const isDuplicate = Array.from(this.groupRegistryUser.values())
			.some((existingGroup) => existingGroup.name === trimmedName && existingGroup.id !== groupId);

		if (isDuplicate) {
			throw new Error(`TabManager.renameUserGroup: user group with name "${ trimmedName }" already exists`);
		}

		group.name = trimmedName;

		loggerService().info(`TabManager.renameUserGroup: renamed user group ${ groupId } to "${ trimmedName }"`);
	}

	@logCall
	public getUserGroups(): UserTabGroup[] {
		return Array.from(this.groupRegistryUser.values());
	}

	@logCall
	public getUserGroup(groupId: UserTabGroupId): UserTabGroup | null {
		return this.groupRegistryUser.get(groupId) ?? null;
	}

	@logCall
	public deleteUserGroup(groupId: UserTabGroupId): void {
		const group = this.groupRegistryUser.get(groupId);
		if (group === undefined) {
			throw new Error(`TabManager.deleteUserGroup: group ${ groupId } was not found`);
		}

		const closedTabIds = [...group.tabIds];

		for (const tabId of closedTabIds) {
			this.closeTab(tabId);
		}

		this.groupRegistryUser.delete(group.id);

		loggerService().info(`TabManager.deleteUserGroup: deleted group "${ group.name }" (${ group.id }), removed ${ closedTabIds.length } tabs`);
	}

	@logCall
	public async deactivateGroup(groupId: TabGroupId): Promise<void> {
		const group = this.getGroup(groupId);
		if (group === null) {
			loggerService().warn(`TabManager.deactivateGroup: group ${ groupId } was not found`);
			return;
		}

		const tabs = group.tabIds
			.map((id) => this.tabRegistry.get(id))
			.filter((tab) => tab !== undefined);

		await Promise.allSettled(
			tabs.map(async(tab) => {
				try {
					await tab.deactivate();
				}
				catch (error) {
					loggerService().error(`TabManager.deactivateGroup: tab.deactivate(id: ${ tab.id }) error`, error);
				}
			})
		);

		loggerService().info(`TabManager.deactivateGroup: deactivated group ${ groupId }, ${ tabs.length } tabs (kept registered)`);
	}

	@logCall
	public getGroupForTab(tabId: TabId): TabGroup | null {
		const groupId = this.tabToGroup.get(tabId);
		if (groupId === undefined) {
			return null;
		}

		return this.groupRegistryDefault.get(groupId) ?? this.groupRegistryUser.get(groupId) ?? null;
	}

	// -- Window-group assignment --

	@logCall
	public resetUserGroupWindowAssignment(windowId: WindowId): void {
		for (const group of this.groupRegistryUser.values()) {
			if (group.windowId === windowId) {
				group.windowId = null;
				loggerService().info(`TabManager.resetUserGroupWindowAssignment: unassigned group "${ group.name }" (${ group.id }) from closing window ${ windowId }`);
			}
		}
	}

	private getGroup(groupId: TabGroupId): MutableTabGroup | null {
		return this.groupRegistryDefault.get(groupId) ?? this.groupRegistryUser.get(groupId) ?? null;
	}

	private findFirstUnpinnedIndex(group: MutableTabGroup): number {
		for (let i = 0; i < group.tabIds.length; i++) {
			const tab = this.tabRegistry.get(group.tabIds[i]);
			if (tab && !tab.pinned) {
				return i;
			}
		}

		return -1;
	}

	private computeInsertPosition(group: MutableTabGroup, pinned: boolean, requestedPosition?: number): number {
		const firstUnpinnedIndex = this.findFirstUnpinnedIndex(group);
		const pinnedCount = firstUnpinnedIndex === -1 ? group.tabIds.length : firstUnpinnedIndex;

		if (pinned) {
			if (requestedPosition !== undefined) {
				return Math.min(Math.max(requestedPosition, 0), pinnedCount);
			}

			return pinnedCount;
		}

		if (requestedPosition !== undefined && requestedPosition <= group.tabIds.length) {
			return Math.max(requestedPosition, pinnedCount);
		}

		return group.tabIds.length;
	}
}

let tabManagerInstance: ITabManager | null = null;

export function tabManager(): ITabManager {
	if (tabManagerInstance === null) {
		tabManagerInstance = new TabManager();
	}

	return tabManagerInstance;
}
