import { loggerService } from '../logger';
import { Group } from './group';
import { GroupName } from './group-names';
import { Linkable } from './linkable';
import { GroupEntry } from './linker';

export class GroupsManager {
	readonly memberToGroupName: Map<string, GroupName> = new Map();
	readonly #groups: Map<GroupName, Group> = new Map();

	public get groups(): ReadonlyMap<GroupName, Group> {
		return this.#groups;
	}

	public getGroupNameByMember(member: Linkable): GroupName | null {
		return this.memberToGroupName.get(member.id) ?? null;
	}

	public getGroupByName(groupName: GroupName): Group {
		let group = this.#groups.get(groupName);
		if (group === undefined) {
			group = new Group();
			this.#groups.set(groupName, group);
		}
		return group;
	}

	public getGroupByMember(member: Linkable): Group | null {
		const groupName = this.getGroupNameByMember(member);
		if (groupName === null) {
			return null;
		}

		return this.getGroupByName(groupName);
	}

	public addMember(newGroupName: GroupName, newMember: Linkable): void {
		const currentGroupName = this.getGroupNameByMember(newMember);
		if (currentGroupName === newGroupName) {
			return;
		}
		if (currentGroupName !== null) {
			this.deleteMemberImpl(newMember);
		}

		this.addNew(newGroupName, newMember);
	}

	public deleteMember(member: Linkable): void {
		member.onLinkGroupChange(null);
		this.deleteMemberImpl(member);
	}

	public hasMember(member: Linkable): boolean {
		return this.memberToGroupName.has(member.id);
	}

	public hasMembersInGroup(groupName: GroupName): boolean {
		const group = this.getGroupByName(groupName);

		return group.members.size !== 0;
	}

	private addNew(groupName: GroupName, member: Linkable): void {
		member.onLinkGroupChange(groupName);
		this.memberToGroupName.set(member.id, groupName);
		const group = this.getGroupByName(groupName);
		group.add(member);
	}

	private deleteMemberImpl(member: Linkable): void {
		const memberGroup = this.getGroupByMember(member);
		if (memberGroup === null) {
			return;
		}
		this.memberToGroupName.delete(member.id);
		if (memberGroup.delete(member)) {
			return;
		}

		loggerService().error(`linking GroupsManager.deleteMemberImpl() class invariant error, ${ member.id } is not in its group`);
		for (const [groupName, group] of this.#groups) {
			if (group.delete(member)) {
				loggerService().warn(`linking GroupsManager.deleteMemberImpl() ${ member.id } found in another group: ${ groupName } and deleted from it`);
			}
		}
	}

	public restoreFromGroupEntriesSnapshot(groupEntries: GroupEntry[], linkableRegistry: ReadonlyMap<string, Linkable>): void {
		this.#groups.clear();
		this.memberToGroupName.clear();

		for (const restoredGroup of groupEntries) {
			const group = new Group(restoredGroup.state.values, restoredGroup.state.channels);
			this.#groups.set(restoredGroup.color, group);
			for (const linkableId of restoredGroup.state.objectIds) {
				const linkable = linkableRegistry.get(linkableId);
				if (linkable !== undefined) {
					this.addNew(restoredGroup.color, linkable);
				}
			}
		}
	}

	public getGroupEntriesSnapshot(): GroupEntry[] {
		const groupEntries: GroupEntry[] = [];
		for (const [groupName, group] of this.#groups) {
			const objectIds = Array.from(group.members, (member) => member.id);
			if (objectIds.length !== 0) {
				groupEntries.push({
					color: groupName,
					state: {
						objectIds,
						channels: group.getChannelsConfig(),
						values: group.getLinkValues() ?? undefined,
					},
				});
			}
		}
		return groupEntries;
	}
}
