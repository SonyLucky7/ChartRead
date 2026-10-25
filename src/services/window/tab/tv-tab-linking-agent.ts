import { IpcMain, IpcMainEvent } from 'electron';
import { Subject } from 'rxjs/internal/Subject';

import { Linkable, LinkChannelsConfig, LinkGroupName, LinkingController, LinkValuesTuple } from '../../../linking';
import { checkForNewValues } from '../../../linking/group';
import { Disposable } from '../../../tvd-runtime/core';
import { PlatformPageProxy } from './platform-page-proxy';
import { UPDATE_LINK_VALUES } from './platform-proxy/tvd-linking-api-extension';

type PlatformLinkablePageProxy = Pick<PlatformPageProxy, 'setLinkValues' | 'requestLinkValuesUpdate' | 'isFocused' | 'isChart'>;

function haveValuesForChannels(linkValues: LinkValuesTuple, channels: LinkChannelsConfig): boolean {
	for (const channel of Object.keys(channels) as Array<keyof LinkChannelsConfig>) {
		if (linkValues[channel] === undefined && channels[channel] === true) {
			return false;
		}
	}
	return true;
}

export class TvTabLinkingAgent implements Disposable, Linkable {
	public unregisterCurrentIpcHandlers: (() => void) | null = null;

	private linkValues: LinkValuesTuple | null = null;
	private pendingLinkValuesFromLinker: LinkValuesTuple | null = null;
	private valuesRequested = false;
	private debounceTimeout: NodeJS.Timeout | null = null;
	private platformProxy: PlatformLinkablePageProxy | null = null;
	private readonly linkableGroupSubject = new Subject<LinkGroupName | null>();

	public readonly linkGroup = this.linkableGroupSubject.asObservable();

	constructor(
		public readonly id: string,
		private readonly linkingController: LinkingController,
		private readonly isWindowAndTabFocused: () => boolean,
	) {
		this.linkingController.registerLinkable(this);
	}

	public registerIpcHandlers(ipcMain: Pick<IpcMain, 'on' | 'off'>): void {
		ipcMain.on(UPDATE_LINK_VALUES, this.handleNewValuesFromPlatform);
		this.unregisterCurrentIpcHandlers = () => {
			ipcMain.off(UPDATE_LINK_VALUES, this.handleNewValuesFromPlatform);
		};
	}

	public activate(platformProxy: PlatformLinkablePageProxy | null): void {
		if (platformProxy === null) {
			this.deactivate();
			return;
		}

		this.platformProxy = platformProxy;
		if (this.linkValues !== null || this.valuesRequested) {
			this.valuesRequested = this.platformProxy.requestLinkValuesUpdate();
		}
		else if (this.pendingLinkValuesFromLinker !== null) {
			this.platformProxy.setLinkValues(this.pendingLinkValuesFromLinker);
			this.pendingLinkValuesFromLinker = null;
		}
	}

	public deactivate(): void {
		this.platformProxy = null;
		this.linkValues = null;
	}

	// Linkable interface implementation
	public onLinkGroupChange(groupName: LinkGroupName | null): void {
		this.linkableGroupSubject.next(groupName);
	}

	public onNewLinkValues(values: LinkValuesTuple): void {
		if (this.platformProxy === null) {
			this.pendingLinkValuesFromLinker = values;
			return;
		}

		this.linkValues = { ...this.linkValues, ...values };

		this.platformProxy.setLinkValues(values);
	}

	public requestValuesUpdate(channels: LinkChannelsConfig): boolean {
		if (this.platformProxy === null) {
			this.valuesRequested = true;
			return false;
		}

		if (this.shouldNotifyWithValuesFromState(channels)) {
			this.debounceLinkingControllerNotification();
			return true;
		}

		this.valuesRequested = this.platformProxy.requestLinkValuesUpdate();

		return this.valuesRequested;
	}
	// End of Linkable interface implementation

	private shouldNotifyWithValuesFromState(channels: LinkChannelsConfig): boolean {
		if (this.platformProxy === null || this.linkValues === null) {
			return false;
		}

		if (!this.platformProxy.isChart && channels.symbol && this.linkValues?.symbol !== undefined) {
			return true;
		}

		if (haveValuesForChannels(this.linkValues, channels)) {
			return true;
		}

		return false;
	}

	private handleNewValuesFromPlatform = (event: IpcMainEvent, linkValues: LinkValuesTuple): void => {
		if (this.linkValues !== null && !checkForNewValues(this.linkValues, linkValues)) {
			return;
		}

		if (this.linkValues === null) {
			this.linkValues = linkValues;
		}
		else {
			this.linkValues = { ...this.linkValues, ...linkValues };
		}
		if (this.shouldUpdateValues()) {
			this.valuesRequested = false;
			this.debounceLinkingControllerNotification();
		}
	};

	private debounceLinkingControllerNotification(): void {
		const debounceTime = 500;
		if (this.debounceTimeout === null) {
			this.debounceTimeout = setTimeout(this.notifyLinkingController.bind(this), debounceTime);
		}
		else {
			this.debounceTimeout.refresh();
		}
	}

	private notifyLinkingController(): void {
		if (this.linkValues === null) {
			return;
		}
		this.linkingController.notifyValuesChange(this, this.linkValues);
	}

	private shouldUpdateValues(): boolean {
		return this.platformProxy?.isFocused() || this.isWindowAndTabFocused() || this.valuesRequested;
	}

	public dispose(): void {
		this.linkableGroupSubject.complete();
		if (this.debounceTimeout !== null) {
			clearTimeout(this.debounceTimeout);
		}
		this.linkingController.unregisterLinkable(this);
		this.deactivate();
		this.unregisterCurrentIpcHandlers?.();
	}
}
