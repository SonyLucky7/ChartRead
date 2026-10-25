import { initializeDiagnosticsInterop } from './diagnostics-interop';
import { getNativeBridge, nativeBridgeInitialized } from './tvd-bridge';

export function intializeNativeInterop(): void {
	initializeDiagnosticsInterop();
}

export function shutdownNativeInterop(): void {
	if (!nativeBridgeInitialized()) {
		return;
	}

	try {
		getNativeBridge().shutdown();
	}
	catch {
	}
}
