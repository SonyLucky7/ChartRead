export const CRASHTEST_SERVICE_CONTRACT = 'tvd:crashtest-service';

export interface ICrashTestService {
	crashNativeProcess(): void;
	crashJs(): void;
	crashNativeModuleAV(): void;
	crashNativeModuleSO(): void;
}
