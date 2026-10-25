import { dialog } from 'electron';
import { StackFrame } from '@sentry/electron/main';
import { ErrorEvent } from '@sentry/types';

import { getTag } from './message-utils';

const crashReasons = new Map<string, string>([
	['clean-exit', 'Clean exit'],
	['abnormal-exit', 'Abnormal exit'],
	['killed', 'Killed'],
	['crashed', 'Crashed'],
	['oom', 'Out of memory'],
	['launch-failed', 'Launch failed'],
	['integrity-failure', 'Integrity failure'],
]);

export function showDefaultErrorDialog(event: ErrorEvent): number {
	const detail = formatError(event);
	const defaultMessage = 'App has crashed due to unexpected error and needs to be restarted';

	return showErrorDialog(defaultMessage, detail, 'Restart');
}

export function showErrorDialog(message: string, detail: string, button: string): number {
	const opts: Electron.MessageBoxOptions = {
		title: 'TradingView Desktop Critical Error',
		message,
		detail,
		type: 'error',
		buttons: ['Quit', button],
		defaultId: 1,
	};

	return dialog.showMessageBoxSync(opts);
}

function formatError(event: ErrorEvent): string {
	const exception = event.exception?.values ? event.exception?.values[0] : undefined;
	const crashReason = getTag<string>(event, 'exit.reason') ?? '';
	const error = exception?.value ?? crashReasons.get(crashReason) ?? 'Unknown Error';
	const stack = Object.assign({}, exception?.stacktrace);

	if (!stack || !stack.frames || stack.frames.length === 0) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return `${ error }\r\n${ errorWithoutStack(event) }\r\n\r\n${ event.event_id }`;
	}

	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	return `${ error }\r\n${ adjustStackTrace(stack.frames) }\r\n\r\n${ event.event_id }`;
}

function adjustStackTrace(frames: StackFrame[]): string {
	const stackDepth = 20;
	let result = '';

	const reversedFrames = frames.reverse().slice(0, stackDepth);
	reversedFrames.forEach(frame => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		result += `\r\nat ${ frame.function ?? 'unknown' }`;
	});

	return result;
}

function errorWithoutStack(event: ErrorEvent): string {
	const { contexts } = event;
	let crashedUrl: string | undefined;

	if (contexts) {
		crashedUrl = contexts.electron?.crashed_url as string;
	}

	return `\r\nat ${ crashedUrl ?? 'unknown' }`;
}
