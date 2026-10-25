import { WebContents } from 'electron';

import { LinkValuesTuple } from '../../../linking';
import { isDateRange, LinkValues } from '../../../linking/linkable';
import { loggerService } from '../../../logger';
import { isChartUrl, isChartUrlWithParams, isLinkableUrl } from '../../../utils';
import { subscribeOnLayoutEvents } from './platform-proxy/layout-platform-api-injects';
import { LINK_VALUES_SETTERS, requestLinkValuesUpdate, subscribeToChartLinkValuesUpdates, subscribeToScreenerLinkValuesUpdates } from './platform-proxy/linking-platform-api-injects';

export class PlatformPageProxy {
	public static makePlatformProxy(webContents: WebContents): PlatformPageProxy | null {
		if (webContents.isDestroyed()) {
			return null;
		}

		const url = webContents.getURL();
		if (isChartUrl(url) || isChartUrlWithParams(url)) {
			return new PlatformPageProxy(webContents, true);
		}
		else if (isLinkableUrl(url)) {
			return new PlatformPageProxy(webContents, false);
		}
		return null;
	}

	private constructor(
		private readonly webContents: WebContents,
		public readonly isChart: boolean
	) {}

	public isFocused(): boolean {
		return this.webContents.isFocused();
	}

	public setLinkValues(values: LinkValuesTuple): void {
		if (this.webContents.isDestroyed()) {
			return;
		}

		for (const [name, value] of Object.entries(values)) {
			this.setLinkValue(name as keyof LinkValuesTuple, value)
				.catch((error) => {
					loggerService().error('PlatformProxy: Failed to set link value', error);
				});
		}
	}

	public initializePlatformApiSubscriptions(): void {
		const linkingSubscriptionInject = this.isChart
			? `(${ subscribeToChartLinkValuesUpdates.toString() })();`
			: `(${ subscribeToScreenerLinkValuesUpdates.toString() })();`;
		this.webContents.executeJavaScript(linkingSubscriptionInject).catch((error) => {
			loggerService().error('PlatformProxy: Error while subscribing to platform linking updates', error);
		});

		if (this.isChart) {
			this.webContents.executeJavaScript(`(${ subscribeOnLayoutEvents.toString() })();`)
				.catch((error) => {
					loggerService().error('PlatformProxy: Error while subscribing to layout events', error);
				});
		}
	}

	public requestLinkValuesUpdate(): boolean {
		if (!this.isChart) {
			return false;
		}
		this.webContents.executeJavaScript(`(${ requestLinkValuesUpdate.toString() })();`).catch((error) => {
			loggerService().error('PlatformProxy: Error while requesting link values update', error);
		});
		return true;
	}

	private async setLinkValue<T extends keyof LinkValues>(channel: T, value: LinkValues[T]): Promise<void> {
		if (this.webContents.isDestroyed()) {
			return;
		}
		if (this.isChart) {
			const jsInject = isDateRange(value)
				? `(${ LINK_VALUES_SETTERS[channel] })(${ value.startTime }, ${ value.endTime });`
				: `(${ LINK_VALUES_SETTERS[channel] })('${ String(value) }');`;

			try {
				await this.webContents.executeJavaScript(jsInject);
			}
			catch (error) {
				loggerService().error(`PlatformProxy: Error while setting link value for channel ${ channel }`, error);
			}
		}
	}
}
