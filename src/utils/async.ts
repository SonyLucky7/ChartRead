import { loggerService } from '../logger';
import { getMessageOfError } from '../tvd-runtime/core';

// if need to update sleep function
// then you should remove path to this file in testPathIgnorePatterns after the update
export function sleep(timeout: number, cancellation?: AbortController): Promise<boolean> {
	if (cancellation && cancellation.signal.aborted) {
		return Promise.resolve(false);
	}

	return new Promise<boolean>(resolve => {
		let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

		const abortSleep = (): void => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
				timeoutHandle = undefined;
				resolve(false);
			}
		};

		if (cancellation) {
			cancellation.signal.addEventListener('abort', abortSleep, { once: true });
		}

		timeoutHandle = setTimeout(() => {
			timeoutHandle = undefined;
			cancellation?.signal.removeEventListener('abort', abortSleep);
			resolve(true);
		}, timeout);
	});
}

// if need to update ignorePromise function
// then you should remove path to this file in testPathIgnorePatterns after the update
export function ignorePromise<T>(promise: Promise<T>): void {
	promise.catch((error: unknown) => {
		const message = getMessageOfError(error);
		console.warn(`Ignoring promise, but error: ${ message }`);
		console.warn((error as Error).stack);
	});
}

/**
 *
 * @default retryAttempts = 3
 * @default retryInv = 1000
 */
export async function makePromiseWithRetry<T>(promise: Promise<T>, retryAttempts = 3, retryInv = 1000): Promise<T | undefined> {
	let promiseResult: T | undefined;
	let promiseFulfilled = false;

	const promiseWithConfirmation = promise
		.then((res) => {
			promiseResult = res;
			promiseFulfilled = true;
		})
		.catch((err) => {
			loggerService().error('[makePromiseWithRetry()] rejected', err);
		});

	let curRetryInv: number = retryInv;
	const retryTryAttemptModifier = 2;
	// it is a linter-rule bug
	// eslint-disable-next-line no-unmodified-loop-condition
	while (!promiseFulfilled && retryAttempts > 0) {
		const cancellationToken = new AbortController();

		await Promise.race([promiseWithConfirmation, sleep(curRetryInv, cancellationToken)]);

		if (!cancellationToken.signal.aborted) {
			cancellationToken.abort();
		}

		retryAttempts--;
		curRetryInv = curRetryInv * retryTryAttemptModifier;
	}

	return promiseResult;
}

export async function unorderedPromiseAllSettled(promises: (() => Promise<any>)[]): Promise<void> {
	const racePromises = promises.map((p, i) => {
		return p()
			.catch((err) => {
				loggerService().error('[unorderedPromiseAllSettled()] Error at provided promise:', err);
			})
			.finally(() => {
				racePromises.splice(i);
			});
	});

	while (racePromises.length > 0) {
		try {
			await Promise.race(racePromises);
		}
		catch (err) {
			loggerService().error('[unorderedPromiseAllSettled()] Error at race:', err);
		}
	}
}
