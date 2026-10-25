import { Linker, LinkingController, LinkingService } from './linker';

let linkerInstance: Linker | undefined;

export function linkingService(): LinkingService {
	if (linkerInstance === undefined) {
		linkerInstance = new Linker();
	}

	return linkerInstance;
}

export function linkingController(): LinkingController {
	if (linkerInstance === undefined) {
		linkerInstance = new Linker();
	}

	return linkerInstance;
}

export { Linkable, LinkValues, LinkChannelsConfig, LinkValuesTuple, DEFAULT_LINK_CHANNELS_CONFIG, LINK_CHANNELS_CONFIG_LINKING_OFF } from './linkable';
export { LinkingService, LinkingController } from './linker';
export { GroupName as LinkGroupName } from './group-names';
