import { captureException, withScope } from '@sentry/electron/main';

import { setupCustomEvent } from './setup-custom-event';

export function captureAssert(error: Error): void {
	setupCustomEvent('assert');

	withScope((scope) => {
		scope.setTag('assert', true);

		captureException(error);
	});
}
