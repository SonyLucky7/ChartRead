import { getNativeBridge } from './tvd-bridge';

interface CrashEmitterInterop {
	emitAccessViolation(): void;
	emitStackOverflow(): void;
}

export function emitAccessViolation(): void {
	return (getNativeBridge().crash_emitter as CrashEmitterInterop).emitAccessViolation();
}

export function emitStackOverflow(): void {
	return (getNativeBridge().crash_emitter as CrashEmitterInterop).emitStackOverflow();
}
