import { HardwareInterop, MouseButton } from './hardware';
import { getNativeBridge } from './tvd-bridge';

export { MouseButton } from './hardware';

export function getMouseButtonState(index: MouseButton): boolean {
	return (getNativeBridge().hardware as HardwareInterop).getButtonState(index);
}
