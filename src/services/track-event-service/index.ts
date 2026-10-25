import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { isAnyScreener, isPineEditorUrl } from '../../utils/tv-uri';
import { CHART_RECORD_IDEA_WARNING_MESSAGE } from '../interfaces';
import { TabContent } from './analytics-events';
import { ITrackEventService, TRACK_EVENT_SERVICE_CONTRACT } from './itrack-event-service';

export function trackEventService(): ITrackEventService {
	return IpcServices.provide<ITrackEventService>(TRACK_EVENT_SERVICE_CONTRACT);
}

export function trackEventServiceProxy(): Promisify<ITrackEventService> {
	return IpcServices.provideProxy<ITrackEventService>(TRACK_EVENT_SERVICE_CONTRACT);
}

export function getTabContent(url: string, message?: string): TabContent {
	switch (true) {
		case isPineEditorUrl(url): {
			return 'pine';
		}
		case isAnyScreener(url): {
			return 'screener';
		}
		case message === CHART_RECORD_IDEA_WARNING_MESSAGE: {
			return 'videoidea';
		}
		default: {
			return 'chart';
		}
	}
}
