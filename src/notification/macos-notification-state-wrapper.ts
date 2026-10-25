import { isDarwin } from '../utils/platform';

let macosNotificationStateInstance: MacosNotificationState | undefined;

function macosNotificationState(): MacosNotificationState {
	if (!isDarwin()) {
		throw new Error('macos-notification-state only works on macOS');
	}

	if (!macosNotificationStateInstance) {
		macosNotificationStateInstance = require('macos-notification-state') as MacosNotificationState;
	}

	return macosNotificationStateInstance;
}

type SessionState = 'SESSION_SCREEN_IS_LOCKED' | 'SESSION_ON_CONSOLE_KEY' | 'SESSION_SCREEN_SLEEP' | 'SESSION_SCREEN_MIRRORING' | 'UNKNOWN';

interface MacosNotificationState {
	getNotificationState(): 'UNKNOWN_ERROR' | SessionState | 'DO_NOT_DISTURB';
	getSessionState(): SessionState;
	getDoNotDisturb(): boolean;
	getDndDisplayLock(): boolean;
	getDndDisplaySleep(): boolean;
	getDndDisplayMirrored(): boolean;
}

export function isNotificationAllowedDarwin(): boolean {
	if (!isDarwin()) {
		return true;
	}

	const sessionState = macosNotificationState().getSessionState();

	if (sessionState === 'SESSION_SCREEN_IS_LOCKED' && macosNotificationState().getDndDisplayLock()) {
		return false;
	}

	if (sessionState === 'SESSION_SCREEN_SLEEP' && macosNotificationState().getDndDisplaySleep()) {
		return false;
	}

	if (sessionState === 'SESSION_SCREEN_MIRRORING' && macosNotificationState().getDndDisplayMirrored()) {
		return false;
	}

	if (macosNotificationState().getDoNotDisturb()) {
		return false;
	}

	return true;
}
