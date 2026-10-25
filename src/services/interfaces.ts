import { Event } from 'electron';
import { Observable } from 'rxjs';

import { isDarwin } from '../utils/platform';
import { Rectangle } from '../utils/Position';
import { UndoEntry } from '../utils/undo-entry';

export const DEFAULT_TAB_TITLE = 'TradingView';
export const ERROR_TAB_TITLE = 'Oops, something went wrong';
export const BLANK_TAB_URL = 'about:blank';
export const DEFAULT_TAB_URL = '#default';
export const NEW_TAB_URL = 'tvd://new-tab';
export const LICENCES_URL = 'tvd://licences';
export const NO_TAB_URL = '';
export const TIMEOUT_ENTER_FULLSCREEN_WIN = 100;
export const TIMEOUT_SHOW_FULLSCREEN_WARNING_MAC = 800;
export const TIMEOUT_HIDE_FULLSCREEN_WARNING = 3000;
export const DARWIN_CONTROLS_WIDTH = 76;
export const darwinOffset = isDarwin() ? DARWIN_CONTROLS_WIDTH : 0;
export const CHART_RECORD_IDEA_WARNING_MESSAGE = 'Video is being recorded. Are you sure you want to leave this page?';

export const DOMAINS = [
	'accounts.google.com',
	'.google.com',
	'.tradingview.com',
	'.twitter.com',
	'.facebook.com',
	'.youtube.com',
	'.doubleclick.net',
	'.adnxs.com'];

export interface BuildInfo {
	appVersion: string;
	buildDate: number;
}

export interface IUndo {
	entriesChange: Observable<void>;
	readonly top: UndoEntry | undefined;
	entries: ReadonlyArray<UndoEntry>;
	undo(): void;
	push(entry: UndoEntry): UndoEntry | undefined;
}

export interface ILicenses {
	[key: string]: string;
}

export interface IRendererService {
	setState(state: string): void;
}

export interface Report {
	name: string;
	content: string;
}

export interface IReportsService {
	getSupportAttachments(): Promise<Report[]>;
	getSentryAttachmentsZip(): Promise<Buffer>;
}

export interface InputAcceptor {
	acceptInput(ev: Event, input: any): void;
}

export interface FullscreenDialog {
	setFullscreenContent(text: string, key: string): Promise<void>;
}
export interface AppState {
	isRunBefore: boolean;
	cid?: string;
}

export type SessionControlEventType = 'start' | 'end';

export type AppWindows = {
	windows: number;
	tabs: number;
};

export type Dimensions = Omit<Rectangle, 'x' | 'y'>;
