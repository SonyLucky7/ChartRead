import {
	BrowserView,
	DownloadURLOptions,
	KeyboardInputEvent,
	MouseInputEvent,
	MouseWheelInputEvent,
	OpenDevToolsOptions,
	Opts,
	Rectangle,
} from 'electron';

import { assert, assertNotNull } from '../../../assertion';

export class BrowserViewFacade {
	protected browserViewMember: BrowserView | null = null;

	protected get browserView(): BrowserView {
		this.assertBrowserViewValid();
		return this.browserViewMember;
	}

	protected set browserView(view: BrowserView) {
		this.browserViewMember = view;
	}

	protected resetBrowserView(): void {
		this.browserViewMember = null;
	}

	isBrowserViewValid(): boolean {
		return !!this.browserViewMember && Boolean(this.browserViewMember.webContents) && !this.browserView.webContents.isDestroyed();
	}

	private assertBrowserViewValid(): asserts this is { browserViewMember: BrowserView; } {
		assertNotNull(this.browserViewMember);
		assertNotNull(this.browserViewMember.webContents);
		assert(!this.browserViewMember.webContents.isDestroyed(), 'webContents is destroyed!');
	}

	// *** const methods
	webContentsId(): number {
		return this.browserView.webContents.id;
	}

	zoomFactor(): number {
		return this.browserView.webContents.zoomFactor;
	}

	openDevTools(options?: OpenDevToolsOptions): void {
		this.browserView.webContents.openDevTools(options);
	}

	getURL(): string {
		return this.browserView.webContents.getURL();
	}

	downloadURL(url: string, options?: DownloadURLOptions): void {
		this.browserView.webContents.downloadURL(url, options);
	}

	isFocused(): boolean {
		return this.browserView.webContents.isFocused();
	}

	capturePage(rect?: Rectangle, opts?: Opts): Promise<Electron.NativeImage> {
		return this.browserView.webContents.capturePage(rect, opts);
	}
	// *** end of const methods

	// *** non const methods
	setBounds(bounds: Rectangle): void {
		this.browserView.setBounds(bounds);
	}

	executeJavaScript<T = any>(code: string, userGesture?: boolean): Promise<T> {
		return this.browserView.webContents.executeJavaScript(code, userGesture) as Promise<T>;
	}

	send(channel: string, ...args: any[]): void {
		this.browserView.webContents.send(channel, args);
	}

	reload(): void {
		this.browserView.webContents.reload();
	}

	focus(): void {
		this.browserView.webContents.focus();
	}

	sendInputEvent(inputEvent: (MouseInputEvent) | (MouseWheelInputEvent) | (KeyboardInputEvent)): void {
		this.browserView.webContents.sendInputEvent(inputEvent);
	}

	setZoomFactor(factor: number): void {
		this.browserView.webContents.setZoomFactor(factor);
	}
	// *** end of non const methods
}
