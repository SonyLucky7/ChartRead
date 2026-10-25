import { WebContents } from 'electron';
import { BehaviorSubject, Observable } from 'rxjs';

import { loggerServiceProxy } from '../../logger';
import { getUID } from '../../tvd-runtime/core';

const enum TaskState {
	Pending,
	Executing,
	Finished,
}

type TaskAction = (webContents: WebContents) => Promise<unknown>;
type TaskReturnType = ReturnType<TaskAction>;

type TaskResolver = (value: unknown) => void;

interface Task {
	id: string;
	action: TaskAction;
	waitResult?(): Promise<TaskReturnType>;
}

interface TaskInternal extends Task {
	state: TaskState;
	taskResolver?: TaskResolver;
}

export interface ITaskService {
	taskNotifications: Observable<void>;

	addTask(action: TaskAction): TaskReturnType;

	getTasks(): Task[];
	canStartTask(id: string): boolean;
	startTask(id: string): void;
	setTaskFinished(id: string, result: unknown): void;
	invalidateTask(id: string): void;
}

export class WebcontentsTaskService implements ITaskService {
	private taskNotificationsSubject = new BehaviorSubject<void>(undefined);
	taskNotifications = this.taskNotificationsSubject.asObservable();

	private tasks: TaskInternal[] = [];

	addTask(action: TaskAction): TaskReturnType {
		let taskResolver: TaskResolver | undefined;
		// eslint-disable-next-line no-return-assign
		const taskPromise = new Promise((resolve) => taskResolver = resolve);

		const task: TaskInternal = {
			id: getUID(),
			action,
			state: TaskState.Pending,
			taskResolver,
		};

		this.tasks.push(task);
		this.taskNotificationsSubject.next();

		return taskPromise;
	}

	getTasks(): Task[] {
		return this.tasks.filter(t => t.state === TaskState.Pending);
	}

	canStartTask(id: string): boolean {
		const task = this.tasks.find(t => t.id === id);

		if (!task) {
			loggerServiceProxy().error(`[TaskService.canStartTask()] Task id ${ id } not found`);

			return false;
		}

		return task.state === TaskState.Pending;
	}

	startTask(id: string): void {
		const task = this.tasks.find(t => t.id === id);

		if (!task) {
			throw new Error(`[TaskService.setFinished()] Task id ${ id } not found`);
		}

		task.state = TaskState.Executing;
	}

	setTaskFinished(id: string, result: unknown): void {
		const task = this.tasks.find(t => t.id === id);

		if (!task) {
			loggerServiceProxy().error(`[TaskService.setFinished()] Task id ${ id } not found`);
			return;
		}

		if (task.state !== TaskState.Executing) {
			loggerServiceProxy().error(`[TaskService.setFinished()] Task id ${ id } incorrect state: ${ task.state }`);
			return;
		}

		task.state = TaskState.Finished;

		if (task.taskResolver) {
			task.taskResolver(result);
		}
	}

	invalidateTask(id: string): void {
		const task = this.tasks.find(t => t.id === id);

		if (!task) {
			loggerServiceProxy().error(`[TaskService.invalidateTask()] Task id ${ id } not found`);
			return;
		}

		task.state = TaskState.Pending;
	}
}
