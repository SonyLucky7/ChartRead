import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { CRASHTEST_SERVICE_CONTRACT, ICrashTestService } from './icrashtest-service';

export { ICrashTestService } from './icrashtest-service';
export { CrashTestService, createCrashTestView } from './crashtest-service';

export function crashTestServiceProxy(): Promisify<ICrashTestService> {
	return IpcServices.provideProxy<ICrashTestService>(CRASHTEST_SERVICE_CONTRACT);
}
