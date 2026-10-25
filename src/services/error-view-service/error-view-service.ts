import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { logCall } from '../../logger/log-decorator';
import { windowService } from '../window';
import { ERROR_VIEW_SERVICE_CONTRACT, IErrorViewService } from '.';

@ExposeSingletonService(ERROR_VIEW_SERVICE_CONTRACT, IpcServices.getProvider())
export class ErrorViewService implements IErrorViewService {
	@logCall
	tryToRestoreFailedTabs(): void {
		const tabs = windowService().getAllTabs();
		tabs.forEach(tab => tab.restoreIfFailed());
	}
}
