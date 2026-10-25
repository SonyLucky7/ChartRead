import { IPerformanceService, PerformanceService } from './performance-service';

export { IPerformanceService } from './performance-service';

let performanceServiceInstance: IPerformanceService | undefined;
export function performanceService(): IPerformanceService {
	if (!performanceServiceInstance) {
		performanceServiceInstance = new PerformanceService();
	}

	return performanceServiceInstance;
}
