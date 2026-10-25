import { ipcRenderer } from 'electron';

import { LinkValuesTuple } from '../../../../linking';

export const UPDATE_LINK_VALUES = 'tvd:update-link-values';

export interface LinkingApi {
	updateLinkValues(update: LinkValuesTuple): void;
}

export interface TVDLinkingApiExtension {
	linkingApi: LinkingApi;
}

export const linkingApi: LinkingApi = {
	updateLinkValues(update: LinkValuesTuple): void {
		ipcRenderer.send(UPDATE_LINK_VALUES, update);
	},
};
