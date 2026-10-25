import { app, shell } from 'electron';
import { close as closeSentry, withScope } from '@sentry/electron/main';
import { ErrorEvent, Primitive } from '@sentry/types';

import { ignorePromise } from '../utils/async';
import { CustomEventName, EventHandler } from './custom-event';
import { showDefaultErrorDialog, showErrorDialog } from './error-dialog';

const registeredHandlers: Map<CustomEventName, EventHandler> = new Map();
const handledErrors: Set<CustomEventName> = new Set();
const terminatingHandlers: Set<EventHandler> = new Set([bridgeNotLoadedHandler, failedAssertionHandler, baseHandler]);
let shouldSkipDialog = false;

interface EventWithCustomErrorTag extends ErrorEvent {
	tags?: {
		[key: string]: Primitive;
		customError?: CustomEventName;
	};
}

export function handleEvent(event: EventWithCustomErrorTag): boolean {
	const { tags } = event;
	const customError = tags?.customError;

	if (customError) {
		withScope(scope => {
			scope.setTag('customError', undefined);
		});

		if (handledErrors.has(customError)) {
			return false;
		}
	}

	const handler = getRegisteredHandlers(customError);

	if (terminatingHandlers.has(handler)) {
		if (shouldSkipDialog) {
			return true;
		}

		shouldSkipDialog = true;
	}

	handler(event);
	return true;
}

function getRegisteredHandlers(customError?: CustomEventName): EventHandler {
	if (!customError) {
		return baseHandler;
	}

	return registeredHandlers.get(customError) ?? baseHandler;
}

function bridgeNotLoadedHandler(): void {
	handledErrors.add('bridge-not-loaded');

	const helpUrl = 'https://www.tradingview.com/support/solutions/43000703335-what-can-i-do-when-app-crashes-at-launch/';
	const message = 'App has crashed due to problem with your system configuration';
	const detail = 'Something in your system configuration is preventing the app from launching. Click the Help button to open a troubleshooting guide in your browser.';
	const button = 'Help';

	const openHelp = !!showErrorDialog(message, detail, button);

	if (openHelp) {
		ignorePromise(shell.openExternal(helpUrl));
	}

	deferredClose(false);
}

function failedAssertionHandler(event: ErrorEvent): void {
	handledErrors.add('assert');

	baseHandler(event);
}

function baseHandler(event: ErrorEvent): void {
	const restart = !!showDefaultErrorDialog(event);

	deferredClose(restart);
}

function deferredClose(restart: boolean): void {
	closeSentry().finally(() => {
		if (restart) {
			app.relaunch();
		}

		app.exit();
	});
}

// native crashes in main handled at start of the next session, so we should not show error dialog and close app in that case
registeredHandlers.set('native-on-start', event => event);
registeredHandlers.set('bridge-not-loaded', bridgeNotLoadedHandler);
// crash of renderer's tab handled by tab itself, so we don't need crash the whole app
registeredHandlers.set('tab-crash', () => { handledErrors.add('tab-crash'); });
// chromium able to restart gpu process invisibly to the user
registeredHandlers.set('gpu-crash', event => event);
registeredHandlers.set('assert', failedAssertionHandler);
// skip message events
registeredHandlers.set('message', event => event);
