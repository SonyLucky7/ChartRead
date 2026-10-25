import { IpcServices } from '../../../ipc-services';
import { intializeNativeInterop, shutdownNativeInterop } from '../../../native';
import { DRAG_SERVICE_CONTRACT, IDragService } from '../../../services/native-drag-service/inative-drag-service';
import { NativeDragService } from '../../../services/native-drag-service/native-drag-service';

IpcServices.initializeRpc();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function startServices(...services: unknown[]): void {
}

export function initializeDragService(): void {
	intializeNativeInterop();

	console.log('Initialized native interop');

	startServices(NativeDragService);
	const dragService = IpcServices.provide<IDragService>(DRAG_SERVICE_CONTRACT);

	window.addEventListener('beforeunload', () => {
		console.warn('Disposing drag services');
		dragService?.dispose();
		shutdownNativeInterop();
	});
}
