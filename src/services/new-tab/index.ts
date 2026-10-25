import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { INewTabService, NEW_TAB_SERVICE_CONTRACT } from './inew-tab-service';

export { ChartItem, ResolutionString, SortDirection, SortField, ChartItemExtended, PageMetadata, LayoutDrawingsCount } from './inew-tab-service';

export function newTabService(): INewTabService {
	return IpcServices.provide<INewTabService>(NEW_TAB_SERVICE_CONTRACT);
}

export function newTabServiceProxy(): Promisify<INewTabService> {
	return IpcServices.provideProxy<INewTabService>(NEW_TAB_SERVICE_CONTRACT);
}
