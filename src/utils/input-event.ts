import { WebContents } from 'electron';

export function keyPressHelper(senderWebContents: WebContents, keyCode: string): void {
	senderWebContents.sendInputEvent({ type: 'keyDown', keyCode });
	senderWebContents.sendInputEvent({ type: 'keyUp', keyCode });
}
