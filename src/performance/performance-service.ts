import { loggerService } from '../logger';
import { BYTES_IN_ONE_KBYTE, HEAP_CHECK_INTERVAL, HEAP_USAGE_CRITICAL_LIMIT, HEAP_USAGE_WARNING_LIMIT } from '../services/window/tab/heap-log-constants';

interface EventEntry {
	name: string;
	time: number;
	id: number;
}

function timeStr(value: Date | number): string {
	const date = typeof value === 'number' ? new Date(value) : value;
	return `${ date.getHours() }:${ date.getMinutes() }:${ date.getSeconds() }`;
}

export interface IPerformanceService {
	beginEvent(name: string): number;
	endEvent(id: number): void;
	notify(name: string): void;
	heapState(): void;
}

export class PerformanceService implements IPerformanceService {
	private readonly startupTime = Date.now();
	private eventCounter = 0;
	private readonly events: Array<EventEntry> = [];
	private readonly heapLimitInKByte = 4194304;
	private warningCounter = 0;
	private criticalHeapCounter = 0;

	beginEvent(name: string): number {
		const id = ++this.eventCounter;
		this.events.push({ id, name, time: Date.now() });
		return id;
	}

	endEvent(id: number): void {
		const index = this.events.findIndex(e => e.id === id);
		if (index < 0) {
			return;
		}

		const ev = this.events.splice(index, 1)[0];
		const now = Date.now();
		const milliseconds = now - ev.time;

		loggerService().debug(`[${ timeStr(ev.time) }]-[${ timeStr(now) }]: '${ ev.name }' (${ milliseconds }) ms`);
	}

	notify(name: string): void {
		const now = Date.now();
		const milliseconds = now - this.startupTime;
		loggerService().debug(`[${ timeStr(now) }]: '${ name }' (${ milliseconds }) ms`);
	}

	heapState(): void {
		setInterval(this.heapInfo, HEAP_CHECK_INTERVAL);
	}

	private heapInfo(): void {
		const heapUsed = Math.round(process.memoryUsage().heapUsed / BYTES_IN_ONE_KBYTE);
		const heapTotal = Math.round(process.memoryUsage().heapTotal / BYTES_IN_ONE_KBYTE);

		const logMessage = `Main process. Heap used ${ heapUsed } Kb. Total heap ${ heapTotal } Kb.`;
		const heapUsage = heapUsed / this.heapLimitInKByte;

		if (heapUsage <= HEAP_USAGE_WARNING_LIMIT) {
			this.warningCounter = 0;
			this.criticalHeapCounter = 0;
			return;
		}
		if (heapUsage > HEAP_USAGE_WARNING_LIMIT) {
			if (this.warningCounter < 2) {
				loggerService().warn(logMessage);
				this.warningCounter++;
				return;
			}
		}
		if (heapUsage > HEAP_USAGE_CRITICAL_LIMIT) {
			if (this.criticalHeapCounter < 2) {
				loggerService().warn(logMessage);
				this.criticalHeapCounter++;
			}
		}
	}
}
