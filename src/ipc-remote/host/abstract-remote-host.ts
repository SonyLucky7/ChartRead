import { RemotableInstanceManager } from '../instance/remotable-instance-manager';
import { InstanceProvider } from '../instance-provider';
import { ProxyProvider } from '../proxy-provider';

export abstract class AbstractRemoteHost {
	constructor(
		protected readonly instanceProviderMember: InstanceProvider,
		protected readonly proxyProviderMember: ProxyProvider,
		protected readonly remoteManager: RemotableInstanceManager
	) {}

	get instanceProvider(): InstanceProvider {
		return this.instanceProviderMember;
	}

	get proxyProvider(): ProxyProvider {
		return this.proxyProviderMember;
	}

	abstract registerRemoteObject(object: Record<string, unknown>, name: string): string;
	abstract unregisterRemoteObject(name: string): boolean;
}
