import { Observable } from 'rxjs';
import { SquareButtonColor } from '@tradingview/ui-lib/buttons/square-button';
import { ButtonVariant } from '@tradingview/ui-lib/buttons/types';

import { LinkChannelsConfig, LinkGroupName } from '../../linking';
import { TabId } from '../../main/tab-manager';
import { RendererData } from '../../tv-api/renderer-data';
import { Chart, SymbolInterval } from '../../tv-api/symbol';
import { Position, Rectangle } from '../../utils/Position';
import { BuildInfo } from '../interfaces';
import { Credentials } from '../password-manager';
import { DefaultSystemNameTab } from '../settings/settings-tabs';
import { TabDataPart } from '../settings/tab-title-interfaces';
import { SaveChangesScope } from './tab/save-changes-types';
import { Tab } from './tab/tab';
import { FullscreenToastMessage } from './toast';
import { Listener, WindowServiceEvents } from './with-listener';

export const WINDOW_DEFAULT_WIDTH = 1024;
export const WINDOW_DEFAULT_HEIGHT = 768;
export const WINDOW_HEADER_HEIGHT = 34;
export const CREATE_NEW_TAB_BUTTON_WIDTH = 34;

export interface DialogWindowSize {
	width: number;
	height: number;
}

export function getLocaleBasedSaveChangesDialogSize(locale: string): DialogWindowSize {
	let size: DialogWindowSize = {
		width: 350,
		height: 220,
	};

	const customDialogWidth = {
		br: 365,
		de: 445,
		es: 430,
		fr: 395,
		id: 360,
		ms: 360,
		pl: 358,
		ru: 400,
		zh: 360,
	};

	const customDialogHeight = {
		fr: 248,
		zh: 196,
	};

	const customDialogSizes = new Map<string, Partial<DialogWindowSize>>([
		['br', { width: customDialogWidth.br }],
		['de_DE', { width: customDialogWidth.de }],
		['es', { width: customDialogWidth.es }],
		['fr', { width: customDialogWidth.fr, height: customDialogHeight.fr }],
		['id', { width: customDialogWidth.id }],
		['ms_MY', { width: customDialogWidth.ms }],
		['pl', { width: customDialogWidth.pl }],
		['ru', { width: customDialogWidth.ru }],
		['zh_CN', { width: customDialogWidth.zh, height: customDialogHeight.zh }],
		['zh_TW', { width: customDialogWidth.zh, height: customDialogHeight.zh }],
	]);

	const customDialogSize = customDialogSizes.get(locale);
	if (customDialogSize) {
		size = { ...size, ...customDialogSize };
	}

	return size;
}

export enum WindowState {
	Normal,
	Maximized,
	Minimized,
	Hidden,
	Fullscreen,
	FullscreenWithPanel,
}

export type WindowStateBeforeFullscreen = Exclude<WindowState, WindowState.Fullscreen | WindowState.FullscreenWithPanel>;

export enum DialogType {
	Basic = 'basic',
	Options = 'options',
	// eslint-disable-next-line @typescript-eslint/no-shadow
	Credentials = 'credentials',
	SignIn = 'sign-in',
	Settings = 'settings',
	SaveChanges = 'save-changes',
	Welcome = 'welcome',
}

export interface AddTabExtraData {
	activate?: boolean;
	position?: number;
	waitLoaded?: boolean;
}

export type DialogData = CommonDialogData | OptionsDialogData | CredentialsDialogData | SaveChangesDialog;

export interface DialogProps<P extends DialogData> {
	inputChange(snapshot: DialogInput): void;
	data: P;
}

export class CommonDialogData {
	type: DialogType;
	closable = false;

	constructor(
		public title?: string,
		public text?: string,
		public buttons?: DialogButton[],
	) {
		this.type = DialogType.Basic;
	}
}

export class SignInDialogData extends CommonDialogData {
	constructor(
		title?: string,
		text?: string,
		buttons?: DialogButton[],
	) {
		super(title, text, buttons);

		this.type = DialogType.SignIn;
	}
}

export class OptionsDialogData extends CommonDialogData {
	options: DialogOption[];

	constructor(
		options: DialogOption[],
		title?: string,
		text?: string,
		buttons?: DialogButton[],
	) {
		super(title, text, buttons);

		this.type = DialogType.Options;
		this.options = options;
	}
}

export class CredentialsDialogData extends CommonDialogData {
	credentials?: Credentials[];
	enteredCredentials: Credentials;
	isUpdateSavedPassword: boolean;

	constructor(
		enteredCredentials: Credentials,
		isUpdateSavedPassword: boolean,
		credentials?: Credentials[],
		title?: string,
		text?: string,
		buttons?: DialogButton[]
	) {
		super(title, text, buttons);

		this.type = DialogType.Credentials;
		this.credentials = credentials;
		this.enteredCredentials = enteredCredentials;
		this.isUpdateSavedPassword = isUpdateSavedPassword;
	}
}

export class SettingsDialogData extends CommonDialogData {
	constructor(
		title?: string,
		text?: string,
		buttons?: DialogButton[],
	) {
		super(title, text, buttons);
		this.type = DialogType.Settings;
	}
}

export class SaveChangesDialog extends CommonDialogData {
	constructor(
		/**
		 * the teardown flow this dialog belongs to; the renderer tags its error subscription and
		 * decision with scope.id so concurrent flows in other windows don't cross-trigger (see SaveChangesDecision)
		 */
		public readonly scope: SaveChangesScope,
	) {
		super();
		this.type = DialogType.SaveChanges;
	}
}

export class WelcomeDialog extends CommonDialogData {
	constructor(
		closable = false,
		title?: string,
		text?: string,
		buttons?: DialogButton[],
	) {
		super(title, text, buttons);
		this.type = DialogType.Welcome;
		this.closable = closable;
	}
}

export interface DialogConstructorOptions {
	data: DialogData;
	windowOptions: Electron.BrowserWindowConstructorOptions;
	closeOnBlur?: boolean;
	closeOnSubmit?: boolean;
	dataChange?: Observable<DialogData>;
	currentActiveTab?: DefaultSystemNameTab;
	buildInfo?: BuildInfo;
}

export interface DialogButton {
	id: DialogActionType;
	text: string;
	color: SquareButtonColor;
	variant: ButtonVariant.Secondary | ButtonVariant.Primary;
}

export interface DialogOption {
	data: unknown;
	name: string;
	id?: string;
	selected?: boolean;
}

export const enum DialogActionType {
	Update = 'update',
	Save = 'save',
	Ok = 'ok',
	Allow = 'allow',
	SaveAndClose = 'save_and_close',
	CloseWithoutSaving = 'close_without_saving',
	Cancel = 'cancel',
	CloseAll = 'close_all',
	Close = 'close',
	SaveAndReload = 'save_and_reload',
	ReloadWithoutSaving = 'reload_without_saving',
	Cross = 'cross',
	OutsideClick = 'outside_click',
	Esc = 'esc',
	Unknown = 'unknown',
}

export interface InputSnapshot {
	dialogAction: DialogActionType;
	button: number;
	input?: DialogInput;
}

export type DialogInput = OptionsInputSnapshot | CredentialsInputSnapshot;

export interface OptionsInputSnapshot {
	options?: DialogOption[];
}

export interface CredentialsInputSnapshot {
	credentials?: Credentials;
}

export interface IDialogControl {
	close(): void;
	closeDialogWindow(dialogAction?: DialogActionType): void;
	closeSaveChangeDialog(): void;
	submitInput(input: InputSnapshot): void;
	dataChange?: Observable<DialogData>;
}

export interface WindowData {
	[key: string]: unknown;
	tabId?: TabId;
	userId?: string;
}

export interface RendererServiceData extends WindowData {
	remoteServiceInstanceId: string;
}

export interface TitleBarWindowData extends RendererServiceData{
	titleBarOptions: TitleBarOptions;
}

export interface DialogWindowData extends RendererServiceData {
	dialogData: DialogData;
	currentActiveTab?: string;
	buildDate?: number;
}

export interface IWindowControl {
	close(): void;
	toggleMaximize(): void;
	toggleMinimize(): void;
	toggleFullscreen(): void;
	getAllowMouseEvents(): boolean;
	getWindowStateAsync(): WindowState;
	getWindowId(): string;
	getWindowBounds(): Rectangle;
	bringToFront(): void;
	disposed(): boolean;
}

export type MenuCloseEventSource = 'context-menu' | 'hotkey-fired' | 'resize' | 'tab-context-menu' | 'tab-panel-click' | 'window-closed';

export interface ITabbedWindowControl extends IWindowControl {
	isWindowFocusedChange: Observable<boolean>;
	windowLoadingChange: Observable<boolean>;
	menuCloseEvent: Observable<MenuCloseEventSource>;

	on(event: WindowServiceEvents, listener: Listener): void;
	notifyListeners(event: WindowServiceEvents): void;
	createAndAddTab(options: CreateTabOptions): Promise<TabId>;
	getTabIndex(tabId: TabId): number;
	acceptExistingTab(tabId: TabId): Promise<TabId>;
	changeTab(tabId: TabId): void;
	duplicateTab(tabId: TabId): Promise<void>;
	closeTab(tabId: TabId, options?: CloseTabOptions): Promise<void>;
	moveTab(oldIndex: number, newIndex: number): void;
	togglePinnedTab(tabId: TabId, pinned: boolean): Promise<void>;
	detachTab(tabId: TabId): TabId | null;
	registerTabController(tabId: TabId, id: string): void;
	registerTabPanel(id: string): void;
	reloadTab(tabId: TabId, hasNewLocale?: boolean): void;
	resetTabs(): void;
	showDevTools(): void;
	triggerMenuCloseEvent(triggerSource: MenuCloseEventSource): void;

	findTabById(tabId: TabId): Tab | null;
}

export interface WindowBounds {
	id: string;
	bounds: Rectangle;
}

export type ZoomDirection = '+' | '-';

export type KeyboardEventData = Pick<KeyboardEvent,
	'key' | 'code' | 'which' |
	'charCode' | 'keyCode' |
	'location' |
	'altKey' | 'shiftKey' | 'metaKey' | 'ctrlKey' |
	'composed' | 'isComposing'
>;

export interface IWindowInputEvents {
	notifyInputEvent(eventName: string, ev: KeyboardEventData, browserLang?: string[]): void;
}

export interface IFullscreenHandler {
	doShowFullscreenWarning(data: FullscreenToastMessage): void;
	closeHTMLFullscreen(tab?: Tab, action?: () => void): Promise<void>;
}

export type TooltipData = TabTitleView;

export enum TooltipRequestType {
	Show = 'show',
	Move = 'move',
}

export interface TooltipRequest {
	text: TooltipData;
	type: TooltipRequestType;
}

export interface ITooltipsControl {
	tooltipTextChange: Observable<TooltipRequest>;
	tooltipActivateState: Observable<boolean>;

	moveTooltip(frameAmount: number, frameTimeout: number, isActive: boolean): Promise<void>;
	showTooltip(tabId: TabId): void;
	activateTooltip(isActive: boolean): void;
	closeTooltip(): Promise<void>;
	setTooltipOffset(offset: number): void;
	setTooltipText(tooltipText: TooltipRequest): void;
}

export interface IWindowMenuControl {
	showTabMenu(tabId: TabId, hasShiftKey: boolean, position: Position): void;
	hideTabMenu(): void;
	showTabGroupMenu(position: Position): void;
	hideTabGroupMenu(): void;
	duplicateTabFromMenu(tabId: TabId): void;
	reloadTabFromMenu(tabId: TabId): void;
	copyLink(link: string): void;
	togglePinnedTabFromMenu(tabId: TabId, pinned: boolean): void;
	detachTabAction(tabId: TabId): void;
	closeTabFromMenu(tabId: TabId): void;
	closeOtherTabsFromMenu(tabId: TabId): void;
	closeTabsToTheRightFromMenu(tabId: TabId): void;
	goBackFromMenu(tabId: TabId): void;
	goForwardFromMenu(tabId: TabId): void;
	openTabDevTools(tabId: TabId): void;
	openTabSettings(): void;
	// linking
	linkFromMenu(tabId: TabId, groupName: LinkGroupName): LinkChannelsConfig;
	unlinkFromMenu(tabId: TabId, groupName: LinkGroupName): void;
	updateLinkChannelsConfigFromMenu(tabId: TabId, partialConfig: Partial<LinkChannelsConfig>): void;
}

// TODO: remove extending TabDataPart interface
export interface TabView extends TabDataPart {
	active: boolean;
	pinned: boolean;
	hasIdeaRecord?: boolean;
	hasFocusOnPineEditor?: boolean;
	isChart?: boolean;
	// TODO: remove optional, make it number | null
	width?: number;
}

export interface TitleBarOptions {
	title?: string;
	showTabs?: boolean;
	showMainMenu?: boolean;
	showMinimize?: boolean;
	showMaximize?: boolean;
	showLayouts?: boolean;
}

export interface Layout {
	charts: Chart[];
	layoutType?: string;
}

export type SymbolData = string | SymbolInterval | Layout;

export function isSymbolInterval(symbol: SymbolData): symbol is SymbolInterval {
	if (typeof symbol === 'string') {
		return false;
	}

	return 'symbol' in symbol;
}

export type TabTitle = string | RendererData;

export interface CreateTabOptions {
	id?: string;
	url?: string;
	title?: TabTitle;
	symbol?: SymbolData;
	watchlist?: string;

	pinned?: boolean;
	fullscreen?: boolean;
	focus?: boolean;
	active?: boolean;
	position?: number;
	waitUntilLoad?: boolean;
}

export interface ReplaceTabOptions {
	id: string;
	url: string;
	title?: TabTitle;
	pinned?: boolean;
}

export interface CloseTabOptions {
	silent?: boolean;
	addToHistory?: boolean;
}

export interface ITabsContainer {
	updateTabUrl(id: string, url: string): Promise<void>;
	updateTabs(tabs: TabView[], resetMousePosition?: boolean): Promise<void>;
}

export enum TabTitleViewType {
	Basic,
	ChartData,
}

type TabTitleViewBasic = {
	type: TabTitleViewType.Basic;
	title: string;
	faviconKey?: string;
}

type TabTitleViewChartData = RendererData & {
	type: TabTitleViewType.ChartData;
}

export type TabTitleView = TabTitleViewBasic | TabTitleViewChartData

export interface ITabController {
	setTitle(title: TabTitleView): void;
	setLinkColor(linkColor: LinkGroupName | null): void;
}

export interface ITabbedWindowEvents {
	initialize(): void;
	windowStateChanged(newState: WindowState): void;
}

export interface IRendererReporter {
	getReport(): Promise<RendererReport>;
}

export interface RendererReport {
	memReport: Electron.BlinkMemoryInfo;
	procMemReport: Electron.ProcessMemoryInfo;
	cpuReport: Electron.CPUUsage;
}

export interface ControlsAreaWidth {
	leftControlWidth: number;
	rightControlWidth: number;
}
