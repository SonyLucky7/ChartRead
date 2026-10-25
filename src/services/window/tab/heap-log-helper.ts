export function heapLogHelper(heapCheckInterval: number, bytesInOneKByte: number, heapUsageWarningLimit: number, heapUsageCriticalLimit: number): void {
	if (!window.TVD) {
		return;
	}

	let sentToSentry = false;
	let warningCounter = 0;
	let criticalHeapCounter = 0;

	enum LogLevel {
		Debug,
		Info,
		Warn,
		Error,
	}
	const logHeap = (): void => {
		const url = window.location.href;
		/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */
		// @ts-ignore
		const heapUsed = Math.round(performance.memory.usedJSHeapSize / bytesInOneKByte);

		// @ts-ignore
		const heapTotal = Math.round(performance.memory.totalJSHeapSize / bytesInOneKByte);

		// @ts-ignore
		const heapLimit = Math.round(performance.memory.jsHeapSizeLimit / bytesInOneKByte);
		/* eslint-enable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */

		const heapUsage = heapUsed / heapLimit;
		const logMessage = `Heap info for TV Tab - ${ url }. Heap Used ${ heapUsed } Kb. Heap Total ${ heapTotal } Kb. Heap Limit ${ heapLimit } Kb.`;
		if (heapUsage <= heapUsageWarningLimit) {
			warningCounter = 0;
			criticalHeapCounter = 0;
			return;
		}
		if (heapUsage > heapUsageWarningLimit) {
			if (warningCounter < 2) {
				window.TVD.log({ level: LogLevel.Warn, message: logMessage });
				warningCounter++;
				return;
			}
		}
		if (heapUsage > heapUsageCriticalLimit) {
			if (!sentToSentry) {
				window.TVD.sendToSentry({
					level: 'warning',
					breadcrumb: logMessage,
				});
				sentToSentry = true;
			}
			if (criticalHeapCounter < 2) {
				window.TVD.log({ level: LogLevel.Warn, message: logMessage });
				criticalHeapCounter++;
			}
		}
	};
	setInterval(logHeap, heapCheckInterval);
}
