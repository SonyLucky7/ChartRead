import { Event, Integration } from '@sentry/types';

import { isTVHostedUrl } from '../../utils/tv-uri';
import { CustomEventName } from '../custom-event';
import { getTag } from '../message-utils';

interface ElectronContext extends Record<string, unknown> {
	details: Partial<Electron.RenderProcessGoneDetails>;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	crashed_url?: string;
}

interface WithElectronContext extends Event {
	contexts: {
		electron: ElectronContext;
	};
}

function hasElectronContext(event: Event): event is WithElectronContext {
	return event.contexts?.electron !== undefined;
}

function putEventNameToTags(event: Event, eventName: CustomEventName): void {
	if (!event.tags) {
		return;
	}

	event.tags.customError = eventName;
}

function isGpuCrash(event: Event): boolean {
	return getTag<string>(event, 'event.process') === 'GPU';
}

function isNativeCrashOnStart(event: Event): boolean {
	if (getTag<string>(event, 'event.environment') !== 'native') {
		return false;
	}

	if (!hasElectronContext(event)) {
		return true;
	}

	const { exitCode } = event.contexts.electron.details;

	if (exitCode !== 0) {
		return false;
	}

	return true;
}

function isTabCrash(event: Event): boolean {
	let isTabUrl = false;

	if (!hasElectronContext(event)) {
		return false;
	}

	if (!event.contexts.electron.crashed_url) {
		return false;
	}

	if (event.contexts.electron.crashed_url !== 'unknown') {
		isTabUrl = isTVHostedUrl(event.contexts.electron.crashed_url);
	}

	return isTabUrl;
}

function isMessage(event: Event): boolean {
	return event.message !== undefined;
}

export class CustomEventIntegration implements Integration {
	static id = 'CustomEventIntegration';
	readonly name = 'CustomEventIntegration';

	processEvent(event: Event): Event {
		if (!event.event_id) {
			return event;
		}

		switch (true) {
			case isMessage(event): putEventNameToTags(event, 'message'); break;
			case isTabCrash(event): putEventNameToTags(event, 'tab-crash'); break;
			case isNativeCrashOnStart(event): putEventNameToTags(event, 'native-on-start'); break;
			case isGpuCrash(event): putEventNameToTags(event, 'gpu-crash'); break;
		}

		return event;
	}
}
