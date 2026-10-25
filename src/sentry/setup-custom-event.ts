import { getCurrentScope } from '@sentry/electron/renderer';

import { CustomEventName } from './custom-event';

export function setupCustomEvent(customError: CustomEventName): void {
	getCurrentScope().setTag('customError', customError);
}
