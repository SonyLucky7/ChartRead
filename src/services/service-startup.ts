import { WebcontentsTaskService } from '../app/webcontent-based-tasks/task-service';
import { linkingService } from '../linking';
import { loggerService } from '../logger';
import { initializeLogger, LoggerService } from '../logger/logger-service';
import { NetworkService } from '../main/network/service';
import { sessionStorageService } from '../main/session-storage';
import { TabManager, tabManager } from '../main/tab-manager';
import { PersistenceService } from '../persistence/persistence-service';
import { SchedulingService } from '../scheduling/scheduling-service-impl';
import { TVFeatureService } from '../tv-services/feature/feature-service';
import { appEventService } from './app-event-service';
import { AppEventService } from './app-event-service/app-event-service';
import { createBrowserApiServicesRenderWorker } from './browser-api/browser-api-services-render-worker-instance';
import { ContextMenuService } from './context-menu/context-menu-service';
import { CrashTestService } from './crashtest-service/crashtest-service';
import { ErrorViewService } from './error-view-service/error-view-service';
import { localeService } from './locale';
import { LocaleService } from './locale/locale-service';
import { mainMenuService } from './main-menu-service';
import { MainMenuService } from './main-menu-service/main-menu-service';
import { mainService } from './main-service';
import { MainService } from './main-service/main-service';
import { configureDragService } from './native-drag-service/native-drag-configuration';
import { NewTabService } from './new-tab/new-tab-service';
import { PasswordManagerService } from './password-manager/password-manager-service';
import { settingsProvider } from './settings';
import { SettingsProvider } from './settings/settings-provider';
import { ThemeManager } from './settings/theme/theme-manager';
import { TabDragHandler } from './tab-drag-handler/main';
import { TrackEventService } from './track-event-service/track-event-service';
import { AutoUpdateService } from './update/auto-update-service';
import { userService } from './user';
import { UserService } from './user/user-service';
import { windowService } from './window';
import { ToastService } from './window/toast-service/toast-service';
import { WindowService } from './window/window-service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function registerServiceFactory(...services: unknown[]): void {}

registerServiceFactory(
	AppEventService,
	PersistenceService,
	UserService,
	MainService,
	TabManager,
	MainMenuService,
	WindowService,
	LoggerService,
	LocaleService,
	TrackEventService,
	SchedulingService,
	AutoUpdateService,
	TabDragHandler,
	NetworkService,
	PasswordManagerService,
	CrashTestService,
	ErrorViewService,
	WebcontentsTaskService,
	TVFeatureService,
	SettingsProvider,
	ThemeManager,
	ToastService,
	NewTabService,
	ContextMenuService,
);

export function initializeServices(): void {
	userService();
	initializeLogger();

	linkingService();
	mainService();
	tabManager();
	mainMenuService();
	localeService();
	sessionStorageService();

	windowService();
	settingsProvider();
	appEventService().doStartup()
		.catch((error) => {
			loggerService().error('initializeServices(): appEventService().doStartup() error', error);
		});

	configureDragService();

	createBrowserApiServicesRenderWorker()
		.catch((error) => {
			loggerService().error('initializeServices(): createBrowserApiServiceProvider() error', error);
		});
}
