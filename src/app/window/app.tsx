import { clsx } from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Typography } from '@tradingview/ui-lib/typography';

import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { shortifyId, shortifyUrl } from '../../logger/log-formatter';
import { TABBED_WINDOW_EVENTS_CONTRACT } from '../../services/contracts';
import { localeServiceProxy, setupI18nLocaleHandler } from '../../services/locale';
import { settingsProviderProxy } from '../../services/settings';
import { windowServiceProxy } from '../../services/window';
import {
	IRendererReporter,
	ITabbedWindowEvents,
	IWindowInputEvents,
	KeyboardEventData,
	RendererReport,
	TitleBarWindowData,
	WindowState,
} from '../../services/window/window-api';
import { WindowServiceEvents } from '../../services/window/with-listener';
import { sleep } from '../../utils/async';
import { isDarwin } from '../../utils/platform';
import { Position } from '../../utils/Position';
import { getRendererInitialData, getWindowControl, notifyViewReady } from '../common/app-common';
import { WindowEvents, WindowEventsContext } from '../common/react-common';
import { Spinner } from '../spinner';
import { Controls } from './controls';
import { TabPanel } from './tab-panel';
import { TabPanelActions } from './tab-panel-actions';

import './app.css';

IpcServices.initializeRpc();

export interface AppState {
	hasTokyoNight: boolean;
	hideTabsFullscreenMacOS: boolean;
	hoverCheckSubject: Subject<Position>;
	isAppWindowFocused: boolean;
	isConnectionGood: boolean;
	isLoading: boolean;
	isRtlSystem: boolean;
	tabHintPosition: number;
	unload: boolean;
	windowState: WindowState;
	windowResizeSubject: Subject<number>;
	windowWidth: number;
}

type InputEvents = 'keydown' | 'keyup' | 'keypress';
type UiEvents = 'resize';
const inputEvents: InputEvents[] = ['keydown', 'keyup', 'keypress'];
type EventHandler = (ev: Event) => void

@logCallName('App')
export class App
	extends React.Component<WithTranslation, AppState>
	implements ITabbedWindowEvents, IRendererReporter {
	public override state: AppState = {
		windowWidth: window.innerWidth,
		isAppWindowFocused: true,
		isLoading: true,
		windowState: WindowState.Normal,
		hoverCheckSubject: new Subject<Position>(),
		windowResizeSubject: new Subject<number>(),
		tabHintPosition: -1,
		isConnectionGood: true,
		isRtlSystem: false,
		unload: false,
		hasTokyoNight: false,
		hideTabsFullscreenMacOS: false,
	};

	private windowId = '';

	private windowStateSubject = new BehaviorSubject<WindowState>(WindowState.Normal);

	private eventListeners = new Map<InputEvents | UiEvents, EventHandler>();

	private macosHideTabsInFullscreenSubscription?: Subscription;

	@logCall
	public initialize(): void {
		this.subscribeOnWindowEvents();
	}

	@logCall
	public override componentDidMount(): void {
		setupI18nLocaleHandler(document.documentElement);

		localeServiceProxy().isRtlSystem()
			.then((isRtlSystem) => {
				this.setState({ isRtlSystem });
			})
			.catch((error) => {
				loggerServiceProxy().error('<App>.componentDidMount(): "localeServiceProxy().isRtlSystem() error"', error);
			});

		this.tokyoNightInitialize();

		this.setParentId()
			.catch((error) => {
				loggerServiceProxy().error('<App>.componentDidMount(): this.setParentId() error', error);
			});

		const resizeDelay = 100;
		this.state.windowResizeSubject
			.pipe(debounceTime(resizeDelay))
			.subscribe((windowWidth) => { this.setState({ windowWidth }); });

		this.windowStateSubject
			.subscribe((windowState: WindowState) => { this.setState({ windowState }); });

		const sleepDuration = 100;
		const waitWhileTranslationsReady = async(): Promise<void> => {
			while (!this.props.tReady) {
				await sleep(sleepDuration);
			}
		};

		Promise.allSettled([
			getWindowControl().getWindowStateAsync(),
			waitWhileTranslationsReady(),
		])
			.then(([windowStateAsync, isTranslationReady]) => {
				if (windowStateAsync.status === 'fulfilled') {
					loggerServiceProxy().debug(`<App>.componentDidMount(): "Will update window state: ${ windowStateAsync.value }"`);
					this.windowStateChanged(windowStateAsync.value);
				}

				if (isTranslationReady.status === 'fulfilled') {
					IpcServices.registerRemoteService(this, TABBED_WINDOW_EVENTS_CONTRACT);

					notifyViewReady();
				}
			})
			.catch((error) => {
				loggerServiceProxy().error('<App>.componentDidMount(): Promise.allSettled() error', error);
			});
	}

	@logCall
	public override componentWillUnmount(): void {
		this.unsubscribeEvents();
	}

	public override render(): JSX.Element {
		if (!this.props.tReady) {
			loggerServiceProxy().warn(`[${ shortifyId(this.windowId) }] App.render(): "translations not ready, loading stub markdown"`);

			return this.renderStub();
		}

		if (this.state.unload) {
			return <></>;
		}

		const { t } = this.props;

		const { titleBarOptions } = getRendererInitialData<TitleBarWindowData>();

		const appClassNames = clsx({
			app: true,
			hidden: this.state.windowState === WindowState.Fullscreen && this.state.hideTabsFullscreenMacOS,
			[this.state.isRtlSystem ? 'rtl-system' : 'ltr-system']: true,
			active: this.state.isAppWindowFocused,
			[isDarwin() ? 'darwin' : 'win']: true,
			fullscreen: this.state.windowState === WindowState.Fullscreen,
		});

		const context: WindowEvents = {
			windowStateSubject: this.windowStateSubject,
			windowResizeSubject: this.state.windowResizeSubject,
			hoverCheckSubject: this.state.hoverCheckSubject,
			windowFocused: this.state.isAppWindowFocused,
			windowId: this.windowId,
			isRtlSystem: this.state.isRtlSystem,
		};

		return (
			<div
				className={ appClassNames }
				onClick={ () => {
					getWindowControl().triggerMenuCloseEvent('tab-panel-click')
						.catch((error) => {
							loggerServiceProxy().error('<App>.onClick(): getWindowControl().triggerMenuCloseEvent() error', error);
						});
				} }
			>
				<header className={ `header ${ this.state.hasTokyoNight ? 'tokyo-night' : '' }` }>
					<Controls windowStateSubject={ this.windowStateSubject } />

					{ titleBarOptions.showTabs &&
						<WindowEventsContext.Provider value={ context }>
							<TabPanel t={ t } />

							<TabPanelActions />
						</WindowEventsContext.Provider>
					}

					{ !titleBarOptions.showTabs && titleBarOptions.title &&
						<Typography tag='span' name='typography-regular-12px' className='window-title'>
							{ titleBarOptions.title }
						</Typography>
					}
				</header>

				{ this.state.isLoading && <Spinner /> }
			</div>
		);
	}

	@logCall
	private tokyoNightInitialize(): void {
		const tokyoNightSubscription = windowServiceProxy().tokyoNightSubject.subscribe((hasTokyoNight) => this.setState({ hasTokyoNight }));

		const tokyoNightUnsubscribe = (): void => {
			tokyoNightSubscription?.unsubscribe();
			removeEventListener('beforeunload', tokyoNightUnsubscribe);
		};

		addEventListener('beforeunload', tokyoNightUnsubscribe);
	}

	private renderStub(): JSX.Element {
		return (
			<>
				<div className='header' />
			</>
		);
	}

	@logCall
	private async setParentId(): Promise<void> {
		this.windowId = await getWindowControl().getWindowId();

		loggerServiceProxy().debug(`App.setParentId(): "Registered window id: ${ shortifyUrl(this.windowId) }"`);
	}

	@logCall
	private subscribeOnWindowEvents(): void {
		function onDisposeCallback(this: App): void {
			this.setState({ unload: true });
			void this.unsubscribeEvents();
		}

		getWindowControl().on(WindowServiceEvents.Dispose, onDisposeCallback.bind(this))
			.catch((error) => {
				loggerServiceProxy().error(
					`<App>.subscribeOnWindowEvents(): getWindowControl().on(WindowServiceEvent: ${ WindowServiceEvents.Dispose }) error`,
					error,
				);
			});
		// getWindowControl subscriptions disposes when window closes
		getWindowControl().isWindowFocusedChange.subscribe((isAppWindowFocused) => {
			this.setState({ isAppWindowFocused });
		});
		getWindowControl().windowLoadingChange.subscribe((isLoading) => {
			this.setState({ isLoading });
		});

		if (isDarwin()) {
			this.macosHideTabsInFullscreenSubscription = settingsProviderProxy().macosHideTabsInFullscreenChange.subscribe((hideTabsFullscreenMacOS) => {
				this.setState({ hideTabsFullscreenMacOS });
			});
		}

		const makeKbEventData = (kev: KeyboardEvent): KeyboardEventData => {
			const data: KeyboardEventData = {
				key: kev.key,
				code: kev.code,
				which: kev.which,
				altKey: kev.altKey,
				shiftKey: kev.shiftKey,
				metaKey: kev.metaKey,
				ctrlKey: kev.ctrlKey,
				charCode: kev.charCode,
				keyCode: kev.keyCode,
				location: kev.location,
				composed: kev.composed,
				isComposing: kev.isComposing,
			};
			return data;
		};

		for (const eventName of inputEvents) {
			const listener = (kev: Event): void => {
				const browserLanguages = [];
				if (window && window.navigator) {
					browserLanguages.push(...window.navigator.languages);
				}
				if (kev instanceof KeyboardEvent) {
					if (kev.key === 'F1') {
						return;
					}

					(getWindowControl() as unknown as Promisify<IWindowInputEvents>).notifyInputEvent(eventName, makeKbEventData(kev), browserLanguages)
						.catch((error) => {
							loggerServiceProxy().error('<App>.subscribeOnWindowEvents(): getWindowControl().notifyInputEvent() error', error);
						});
				}
			};
			window.addEventListener(eventName, listener);
			this.eventListeners.set(eventName, listener);
		}

		const onResizeHandler = (): void => this.state.windowResizeSubject.next(window.innerWidth);

		window.addEventListener('resize', onResizeHandler);
		this.eventListeners.set('resize', onResizeHandler);
	}

	private unsubscribeEvents(): void {
		// this.wndSubscriptions.forEach((subscription) => subscription.unsubscribe());
		this.macosHideTabsInFullscreenSubscription?.unsubscribe();

		for (const eventName of this.eventListeners.keys()) {
			const eventListener = this.eventListeners.get(eventName);

			if (eventListener) {
				console.log(`Will remove listener for event ${ eventName }`);
				window.removeEventListener(eventName, eventListener);
			}
		}
	}

	public windowStateChanged(state: WindowState): void {
		this.windowStateSubject.next(state);
	}

	@logCall
	public async getReport(): Promise<RendererReport> {
		const reportCollectionInv = 1000;
		let cpuUsage = process.getCPUUsage();
		await sleep(reportCollectionInv);
		cpuUsage = process.getCPUUsage();

		return {
			memReport: process.getBlinkMemoryInfo(),
			procMemReport: await process.getProcessMemoryInfo(),
			cpuReport: cpuUsage,
		};
	}
}
