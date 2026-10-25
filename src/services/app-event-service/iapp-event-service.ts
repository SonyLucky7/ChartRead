import { Observable } from 'rxjs';

export interface IAppEventService {
	startup: Observable<void>;
	shutdown: Observable<void>;

	isClosing(): boolean;
	isAutosaveInProgress(): boolean;
	setIsAutosaveInProgress(value: boolean): void;

	doStartup(): Promise<void>;
	getCid(): string | undefined;
}

export const APP_EVENT_SERVICE_CONTRACT = 'tvd:app-event-service';
