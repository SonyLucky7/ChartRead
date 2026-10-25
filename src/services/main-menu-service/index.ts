import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { IMainMenuService, MAIN_MENU_SERVICE_CONTRACT } from './imain-menu-service';

export function mainMenuService(): IMainMenuService {
	return IpcServices.provide<IMainMenuService>(MAIN_MENU_SERVICE_CONTRACT);
}

export function mainMenuServiceProxy(): Promisify<IMainMenuService> {
	return IpcServices.provideProxy<IMainMenuService>(MAIN_MENU_SERVICE_CONTRACT);
}
