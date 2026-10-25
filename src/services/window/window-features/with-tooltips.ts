import { app, BrowserWindow } from 'electron';
import { BehaviorSubject, ReplaySubject, Subscription } from 'rxjs';

import { loggerService } from '../../../logger';
import { ignorePromise, isDarwin, sleep } from '../../../utils';
import { animationTooltip, shouldShow } from '../../../utils/tooltip';
import { dragServiceProxy } from '../../native-drag-service';
import { isDragServiceReady } from '../../native-drag-service/native-drag-configuration';
import { settingsProvider } from '../../settings';
import { TabTitleState } from '../../settings/tab-title-interfaces';
import { themeManager } from '../../settings/theme';
import { TabbedWindowBase } from '../tabbed-window';
import { CloseTabOptions, ITooltipsControl, TabTitleViewType, TitleBarWindowData, TooltipRequest, TooltipRequestType } from '../window-api';
import { WindowMixin } from './window-mixin';

const HIDE_TOOLTIP_TIMEOUT = 20;
const TOOLTIP_BORDER_BLUR = 4;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const TOOLTIP_VERTICAL_SHIFT = 34;

export interface IAnimationFrame {
	position: number;
}

export interface IAnimationData {
	position: IAnimationPosition;
	stepsAmount: number;
}

export interface IAnimationPosition {
	currentPosition: number;
	finalPosition: number;
}

const DEFAULT_TOOLTIP_WIDTH = 300;
const DEFAULT_TOOLTIP_HEIGHT = 150;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/naming-convention
export function WithTooltips<T extends WindowMixin<TabbedWindowBase>>(Base: T) {
	return class WndWithTooltips extends Base implements ITooltipsControl {
		private tooltipWindow?: BrowserWindow;
		private tooltipOffset?: number;
		private tabSettingsStateSubscription?: Subscription;
		private tabSettingsState?: TabTitleState[];
		private themeSubscription?: Subscription;

		private readonly tooltipTextChangeEvent = new BehaviorSubject<TooltipRequest>({
			text: { title: '', type: TabTitleViewType.Basic },
			type: TooltipRequestType.Show,
		});

		readonly tooltipTextChange = this.tooltipTextChangeEvent.asObservable();

		private readonly tooltipActivateStateEvent = new ReplaySubject<boolean>(1);
		readonly tooltipActivateState = this.tooltipActivateStateEvent.asObservable();

		constructor(...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);

			this.tabSettingsStateSubscription = settingsProvider().tabChange.subscribe(value => {
				this.tabSettingsState = value;
			});

			this.windowRef
				.on('blur', () => {
					ignorePromise(this.closeTooltip());
				})
				.on('close', () => {
					ignorePromise(this.closeTooltip());
				});

			ignorePromise(this.createTooltip());

			this.acceptInput = (ev, input) => {
				if (this.tooltipWindow && !this.tooltipWindow.isDestroyed()) {
					this.tooltipWindow.hide();
				}

				super.acceptInput(ev, input);
			};
		}

		private async createTooltipWindow(): Promise<BrowserWindow> {
			const tooltip = new BrowserWindow({
				resizable: false,
				// TODO: research why is it used with false in TVD-2873
				focusable: false,
				fullscreenable: false,
				frame: false,
				show: false,
				transparent: true,
				hasShadow: false,
				width: DEFAULT_TOOLTIP_WIDTH,
				height: DEFAULT_TOOLTIP_HEIGHT,
				webPreferences: {
					devTools: true,
					contextIsolation: false,
					nodeIntegration: true,
				},
			});

			let loadOptions: Electron.LoadFileOptions | undefined;
			const rendererData: TitleBarWindowData = this.rendererInitialData;

			if (rendererData) {
				loadOptions = {
					query: { rendererInitialData: JSON.stringify(rendererData) },
				};
			}

			await tooltip.webContents.loadFile(`${ app.getAppPath() }/app/tooltip/index.html`, loadOptions);

			return tooltip;
		}

		async createTooltip(): Promise<void> {
			this.tooltipWindow = await this.createTooltipWindow();

			this.themeSubscription = themeManager().themeChange.subscribe(() => {
				if (this.tooltipWindow && !this.tooltipWindow.isDestroyed()) {
					themeManager().applyTheme(this.tooltipWindow.webContents);
				}
			});

			this.tooltipWindow.on('close', () => {
				this.themeSubscription?.unsubscribe();
			});
		}

		async moveTooltip(frameAmount: number, frameTimeout: number, isActive: boolean): Promise<void> {
			if (
				!this.tooltipWindow ||
				this.tooltipWindow.isDestroyed() ||
				!this.tooltipWindow.webContents ||
				this.tooltipWindow.webContents.isDestroyed()
			) {
				return;
			}

			const isInDrag = isDragServiceReady() && await dragServiceProxy().getIsInDrag();

			if (this.tooltipOffset === undefined || isInDrag) {
				return;
			}

			const windowBounds = this.windowRef.getContentBounds();
			const tooltipBounds = this.tooltipWindow.getContentBounds();

			if (tooltipBounds.width !== DEFAULT_TOOLTIP_WIDTH || tooltipBounds.height !== DEFAULT_TOOLTIP_HEIGHT) {
				this.tooltipWindow.setBounds({
					width: DEFAULT_TOOLTIP_WIDTH,
					height: DEFAULT_TOOLTIP_HEIGHT,
				}, false);
			}

			const currentPositionX = tooltipBounds.x;
			const moveToX = windowBounds.x + this.tooltipOffset;

			const animation = animationTooltip({
				position: { currentPosition: currentPositionX, finalPosition: moveToX },
				stepsAmount: frameAmount,
			});

			for (const frame of animation) {
				await sleep(frameTimeout);
				this.activateTooltip(isActive);
				this.tooltipWindow.setPosition(frame.position + currentPositionX - TOOLTIP_BORDER_BLUR, windowBounds.y + TOOLTIP_VERTICAL_SHIFT, false);
			}
		}

		showTooltip(tabId: string): void {
			const tooltipValue = this.tooltipTextChangeEvent.value;
			const tabUrl = this.findTabById(tabId)?.url;

			if (!shouldShow(tooltipValue.text, this.tabSettingsState, tabUrl)) {
				return;
			}

			try {
				// eslint-disable-next-line @typescript-eslint/no-extra-parens
				if (this.tooltipOffset === undefined || !this.tooltipWindow) {
					return;
				}

				this.tooltipWindow.setParentWindow(this.windowRef);

				const bounds = this.windowRef.getContentBounds();

				const tooltipBounds = {
					x: bounds?.x + this.tooltipOffset - TOOLTIP_BORDER_BLUR,
					y: bounds?.y + TOOLTIP_VERTICAL_SHIFT,
				};
				this.tooltipWindow.setBounds(tooltipBounds, false);
				this.tooltipWindow.setAlwaysOnTop(true, 'pop-up-menu', 1);
				this.tooltipWindow.show();
				ignorePromise(this.tooltipWindow.webContents.insertCSS('#root { visibility: visible; }'));
			}
			catch (err) {
				loggerService().error('Error at showing tooltip', err);
			}
		}

		activateTooltip(isActive: boolean): void {
			if (!this.tooltipWindow || this.tooltipWindow.isDestroyed()) {
				return;
			}

			this.tooltipActivateStateEvent.next(isActive);
		}

		async closeTooltip(): Promise<void> {
			if (!this.tooltipWindow || this.tooltipWindow.isDestroyed()) {
				return;
			}

			await this.tooltipWindow.webContents.insertCSS('#root { visibility: hidden; }');

			// TODO: on Linux tooltip not show without sleep after css injection
			if (!isDarwin()) {
				await sleep(HIDE_TOOLTIP_TIMEOUT);
			}

			if (!this.tooltipWindow.isDestroyed()) {
				this.tooltipWindow.hide();
			}
		}

		setTooltipOffset(offset: number): void {
			this.tooltipOffset = offset;
		}

		setTooltipText(data: TooltipRequest): void {
			this.tooltipTextChangeEvent.next(data);
		}

		override closeTab(...args: [tabId: string, options: CloseTabOptions]): Promise<void> {
			return this.closeTooltip()
				.then(() => super.closeTab(...args));
		}

		override async dispose(): Promise<void> {
			if (!this.tooltipWindow?.isDestroyed()) {
				this.tooltipWindow?.destroy();
			}
			this.tabSettingsStateSubscription?.unsubscribe();
			this.themeSubscription?.unsubscribe();

			await super.dispose();
		}
	};
}
