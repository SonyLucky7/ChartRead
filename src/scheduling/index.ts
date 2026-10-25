import { ISchedulingService } from './scheduling-service';
import { SchedulingService } from './scheduling-service-impl';

export { TaskQueue, Scheduler, SchedulerMode, createTaskQueue } from './task-queue';
export { ISchedulingService } from './scheduling-service';
export { SchedulerProvider, scheduledCall } from './scheduledcall';

let schedulingServiceInstance: ISchedulingService | undefined;
export function schedulingService(): ISchedulingService {
	if (!schedulingServiceInstance) {
		schedulingServiceInstance = new SchedulingService();
	}

	return schedulingServiceInstance;
}
