import { logCall, logCallName } from '../logger/log-decorator';
import { getConfiguration } from '../services/configuration';
import { Disposable, maxHeap } from '../tvd-runtime/core';

export enum SchedulerMode {
	Background,
	Foreground,
	Freezed,
}

export type TaskFactory<T = unknown> = () => Promise<T>;
export type PriorityProvider<T = unknown> = (value: T) => number;

export interface Scheduler extends Disposable {
	mode: SchedulerMode;
	isActive: boolean;
	schedule<T>(taskFactory: TaskFactory<T>, id?: string): Promise<T>;
	invalidate(): void;
}

export interface TaskQueue {
	createScheduler<T>(priorityProvider: PriorityProvider<T>, priorityValue?: T): Scheduler;
	invalidate(): void;
}

class SchedulerImpl implements Scheduler {
	private readonly queue: TaskQueueImpl;
	private readonly priorityProvider: PriorityProvider;
	private readonly priorityValue: unknown;

	private schedulerMode = SchedulerMode.Background;
	private schedulerPriority: number;

	isRunning = false;

	constructor(queue: TaskQueueImpl, priorityProvider: PriorityProvider, priorityValue: unknown) {
		this.queue = queue;
		this.priorityProvider = priorityProvider;
		this.priorityValue = priorityValue;

		this.schedulerPriority = this.priorityProvider(this.priorityValue);
	}

	get priority(): number {
		return this.schedulerPriority;
	}

	updatePriority(): void {
		this.schedulerPriority = this.priorityProvider(this.priorityValue);
	}

	invalidate(): void {
		this.queue.invalidate();
	}

	schedule<T>(taskFactory: TaskFactory<T>, id?: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.enqueue({
				scheduler: this,
				id,
				start: taskFactory,
				resolve,
				reject,
			});
		});
	}

	dispose(): void {
		this.queue.closeScheduler(this);
	}

	get mode(): SchedulerMode {
		return this.schedulerMode;
	}

	set mode(mode: SchedulerMode) {
		if (this.schedulerMode === mode) {
			return;
		}

		this.schedulerMode = mode;
		if (mode !== SchedulerMode.Freezed) {
			this.queue.startNextTask();
		}
	}

	get isActive(): boolean {
		if (this.mode === SchedulerMode.Freezed) {
			return false;
		}

		return this.schedulerMode === SchedulerMode.Foreground || this.isRunning;
	}
}

interface PendingTaskEntry {
	readonly scheduler: SchedulerImpl;

	start(): Promise<unknown>;
	resolve(value: unknown): void;
	reject(error: unknown): void;

	readonly id?: string;
}

@logCallName('TaskQueueImpl')
class TaskQueueImpl implements TaskQueue {
	private readonly pendingTasks: PendingTaskEntry[] = [];
	private readonly schedulers: SchedulerImpl[] = [];
	private readonly priorityQueue = maxHeap(this.pendingTasks, (t1: PendingTaskEntry, t2: PendingTaskEntry): number => {
		const p1 = t1.scheduler.priority;
		const p2 = t2.scheduler.priority;
		return p1 === p2 ? 0 : p1 < p2 ? -1 : 1;
	});

	private runningTasks = 0;
	private readonly maxConcurrentTasks;

	constructor(maxConcurrentTasks: number) {
		this.maxConcurrentTasks = maxConcurrentTasks;
	}

	@logCall
	private startTask(pendingTask: PendingTaskEntry): void {
		this.notifyTaskStarted();
		pendingTask.scheduler.isRunning = true;

		pendingTask.start()
			.then(result => pendingTask.resolve(result))
			.catch((error: unknown) => pendingTask.reject(error))
			.finally(() => {
				pendingTask.scheduler.isRunning = false;
				this.notifyTaskFinished();
			});
	}

	get runningTasksCount(): number {
		return this.runningTasks;
	}

	notifyTaskStarted(): void {
		++this.runningTasks;
	}

	notifyTaskFinished(): void {
		if (this.runningTasks === 0) {
			throw new Error('notifyTaskFinised, but active task counter === zero');
		}
		--this.runningTasks;

		this.prioritizeAndStartNextTask();
	}

	// private dumpPendingTasksPriorities(): void {
	// 	const priors = this.pendingTasks.map(t => t.scheduler.priority);
	// 	console.debug(`${JSON.stringify(priors)}`);
	// }

	private prioritizeAndStartNextTask(): void {
		this.priorityQueue.heapify();
		this.startNextTask();
	}

	startNextTask(): void {
		if (this.runningTasks >= this.maxConcurrentTasks) {
			return;
		}

		for (let index = 0; index < this.pendingTasks.length;) {
			const pendingTask = this.pendingTasks[index];
			if (pendingTask.scheduler.isActive) {
				this.pendingTasks.splice(index, 1);
				this.startTask(pendingTask);
			}
			else {
				++index;
			}
		}

		const hasActiveTasks = this.schedulers.some(scheduler => scheduler.mode !== SchedulerMode.Freezed && scheduler.isRunning);
		if (!hasActiveTasks) {
			const pendingTask = this.priorityQueue.pop();
			if (pendingTask) {
				this.startTask(pendingTask);
			}
		}
	}

	createScheduler<T>(priorityProvider: PriorityProvider<T>, priorityValue: T): Scheduler {
		const len = this.schedulers.push(new SchedulerImpl(this, priorityProvider as PriorityProvider, priorityValue));
		return this.schedulers[len - 1];
	}

	closeScheduler(scheduler: SchedulerImpl): void {
		for (let index = 0; index < this.pendingTasks.length;) {
			if (this.pendingTasks[index].scheduler === scheduler) {
				this.pendingTasks.splice(index, 1);
			}
			else {
				++index;
			}
		}

		const schedulerIndex = this.schedulers.indexOf(scheduler);
		if (schedulerIndex >= 0) {
			this.schedulers.splice(schedulerIndex, 1);
		}

		this.prioritizeAndStartNextTask();
	}

	enqueue(pendingTask: PendingTaskEntry): void {
		// first attempt to find existing task (task with the same id on specified scheduler
		// and if it exists just overriding it with new one (i.e. previous task will never be started).
		if (pendingTask.id) {
			const existingTaskIndex = this.pendingTasks.findIndex(entry => entry.scheduler === pendingTask.scheduler && entry.id === pendingTask.id);
			if (existingTaskIndex >= 0) {
				this.pendingTasks[existingTaskIndex] = pendingTask;
				return;
			}
		}

		this.priorityQueue.push(pendingTask);
		this.startNextTask();
	}

	invalidate(): void {
		for (const t of this.pendingTasks) {
			t.scheduler.updatePriority();
		}

		this.prioritizeAndStartNextTask();
	}
}

export function createTaskQueue(): TaskQueue {
	const concurrencyLimit = getConfiguration().advanced.concurrencyLimit;

	return new TaskQueueImpl(concurrencyLimit);
}
