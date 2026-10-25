import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { CONTEXT_MENU_SERVICE_CONTRACT, IContextMenuService } from './icontext-menu-service';

export { OpenInAction } from './icontext-menu-service';

export function contextMenuService(): IContextMenuService {
	return IpcServices.provide<IContextMenuService>(CONTEXT_MENU_SERVICE_CONTRACT);
}

export function contextMenuServiceProxy(): Promisify<IContextMenuService> {
	return IpcServices.provideProxy<IContextMenuService>(CONTEXT_MENU_SERVICE_CONTRACT);
}
