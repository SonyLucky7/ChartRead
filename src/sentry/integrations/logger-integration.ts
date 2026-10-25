import { Event, Integration } from '@sentry/types';

type LoggerFunction = (message: string) => void;

export class LoggerIntegration implements Integration {
	static id = 'LoggerIntegration';
	readonly name = 'LoggerIntegration';

	static loggerFunction: LoggerFunction = (message: string) => console.log(message);

	static setupLoggerFunction(loggerFunction: LoggerFunction): void {
		LoggerIntegration.loggerFunction = loggerFunction;
	}

	processEvent(event: Event): Event {
		if (event.event_id) {
			LoggerIntegration.loggerFunction(`Crash occured, sentry event id = ${ event.event_id }`);
		}

		return event;
	}
}
