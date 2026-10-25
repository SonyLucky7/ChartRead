import { loggerServiceProxy } from '../../logger';
import { addBreadcrumb, setTag } from '../../sentry/renderer';
import { BYTES_IN_ONE_KBYTE, HEAP_CHECK_INTERVAL, HEAP_USAGE_CRITICAL_LIMIT, HEAP_USAGE_WARNING_LIMIT } from '../../services/window/tab/heap-log-constants';
import { RendererServiceData } from '../../services/window/window-api';
import { getRendererInitialData } from '../common/app-common';

let sentToSentry = false;
let warningCounter = 0;
let criticalHeapCounter = 0;

function heapLogLimit(): void {
	/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */
	// @ts-ignore
	const heapLimit = Math.round(performance.memory.jsHeapSizeLimit / BYTES_IN_ONE_KBYTE);
	/* eslint-enable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */

	setTag('memory.heapLimit', heapLimit.toString());
}

function heapLog(): void {
	const data = getRendererInitialData<RendererServiceData>();
	const id = data.remoteServiceInstanceId ?? window.location.href;

	/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */
	// @ts-ignore
	const heapUsed = Math.round(performance.memory.usedJSHeapSize / BYTES_IN_ONE_KBYTE);

	// @ts-ignore
	const heapTotal = Math.round(performance.memory.totalJSHeapSize / BYTES_IN_ONE_KBYTE);

	// @ts-ignore
	const heapLimit = Math.round(performance.memory.jsHeapSizeLimit / BYTES_IN_ONE_KBYTE);
	/* eslint-enable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */

	const heapUsage = heapUsed / heapLimit;
	const logMessage = `Heap info for renderer - ${ id }. Heap Used ${ heapUsed } Kb. Heap Total ${ heapTotal } Kb. Heap Limit ${ heapLimit } Kb.`;
	if (heapUsage <= HEAP_USAGE_WARNING_LIMIT) {
		warningCounter = 0;
		criticalHeapCounter = 0;
		return;
	}
	if (heapUsage > HEAP_USAGE_WARNING_LIMIT) {
		if (warningCounter < 2) {
			loggerServiceProxy().warn(logMessage);
			warningCounter++;
			return;
		}
	}
	if (heapUsage > HEAP_USAGE_CRITICAL_LIMIT) {
		if (!sentToSentry) {
			addBreadcrumb({ level: 'warning', breadcrumb: logMessage });
			sentToSentry = true;
		}
		if (criticalHeapCounter < 2) {
			loggerServiceProxy().warn(logMessage);
			criticalHeapCounter++;
		}
	}
}

let interval: NodeJS.Timeout;

export function initRenderHeapLog(checkInterval: number = HEAP_CHECK_INTERVAL): void {
	heapLogLimit();
	if (interval) {
		loggerServiceProxy().error('Heap log for this renderer already exist');
		return;
	}
	interval = setInterval(heapLog, checkInterval);
}
