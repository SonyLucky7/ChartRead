import { app } from 'electron';

import { persistenceService } from '../persistence';
import { ISchedulingService } from './scheduling-service';
import { createTaskQueue, TaskQueue } from './task-queue';

export class SchedulingService implements ISchedulingService {
	readonly defaultTaskQueue: TaskQueue = createTaskQueue();

	constructor() {
		app.on('browser-window-focus',
			() => this.defaultTaskQueue.invalidate());

		persistenceService().stateRestored.subscribe({
			next: () => {
				this.defaultTaskQueue.invalidate();
			},
		});
	}
}
