import { RemotableInstance } from './remotable-instance';

export class RemotableInstanceManager {
	private instances: Map<string, RemotableInstance> = new Map();

	onHostDead(id: number): void {
		this.instances.forEach(instance => {
			instance.onHostDead(id);
		});
	}

	hasInstance(name: string): boolean {
		return this.instances.has(name);
	}

	getInstance(name: string): RemotableInstance {
		const instance = this.instances.get(name);

		if (!instance) {
			throw new Error(`Remotable ${ name } not registered`);
		}

		return instance;
	}

	registerInstance(instance: Record<string, unknown>, name: string): string {
		const entry = RemotableInstance.wrapIntstanceToRemotable(instance, name);
		if (this.instances.has(entry.id)) {
			throw new Error(`Remotable ${ entry.id } registered already`);
		}

		this.instances.set(entry.id, entry);
		return entry.id;
	}

	unregisterInstance(name: string): boolean {
		return this.instances.delete(name);
	}
}
