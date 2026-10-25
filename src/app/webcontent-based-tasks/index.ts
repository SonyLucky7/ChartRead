import { ITaskService, WebcontentsTaskService } from './task-service';

let taskServiceInstance: ITaskService | undefined;

export function webcontentTaskService(): ITaskService {
	if (!taskServiceInstance) {
		taskServiceInstance = new WebcontentsTaskService();
	}

	return taskServiceInstance;
}
