import { BrowserWindow } from 'electron';
import * as os from 'os';

export function getNativeWindowHandleInt32(win: BrowserWindow): number {
	const windowHandlerBuf = win.getNativeWindowHandle();

	if (os.endianness() === 'LE') {
		return windowHandlerBuf.readInt32LE(0);
	}
	else {
		return windowHandlerBuf.readInt32BE(0);
	}
}
