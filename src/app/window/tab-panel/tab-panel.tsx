import { TFunction } from 'i18next';
import React, { Component } from 'react';
import { Subscription } from 'rxjs';

import { IpcServices } from '../../../ipc-services';
import { loggerServiceProxy } from '../../../logger';
import { logCall, logCallName } from '../../../logger/log-decorator';
import { shortifyId } from '../../../logger/log-formatter';
import { TABS_CONTAINER_CONTRACT } from '../../../services/contracts';
import { DARWIN_CONTROLS_WIDTH, darwinOffset } from '../../../services/interfaces';
import { defaultBounds, dragServiceProxy, IElement } from '../../../services/native-drag-service';
import { tabDragHandlerProxy } from '../../../services/tab-drag-handler/renderer';
import { windowServiceProxy } from '../../../services/window';
import { ControlsAreaWidth, ITabsContainer, TabView, WINDOW_HEADER_HEIGHT, WindowState } from '../../../services/window/window-api';
import { isDarwin, Position, Rectangle, sleep } from '../../../utils';
import { getWindowControl } from '../../common/app-common';
import { moveTab, resetTabsOffset } from '../../common/move-tab';
import { WindowEventsContext } from '../../common/react-common';
import { CreateNewTabButton } from '../create-new-tab-button';
import { Tab } from './tab';
import { TabDragData, TabSize } from './tab-utils';

import './tab-panel.css';

interface State {
	tabs: TabView[] | null;
	hoveredTabIndex: number | null;
	isLastWindow: boolean;
	isTooltipVisibleGlobal: boolean;
	lastTabRightBorder: number;
	lastTabClickedId: string;
	prevCursorPoint?: Position;
}

interface Props {
	t: TFunction;
}

export const CONTROL_TO_TABS_GAP = 8;
const MENU_LEFT_PADDING = 20;
const TAB_FLEX_BASIS = 250;
@logCallName('TabPanel')
export class TabPanel extends Component<Props, State>
	implements ITabsContainer, IElement {
	static override contextType = WindowEventsContext;
	declare context: React.ContextType<typeof WindowEventsContext>;

	private windowCountSubscription?: Subscription;

	public override state: State = {
		tabs: null,
		hoveredTabIndex: null,
		isLastWindow: false,
		isTooltipVisibleGlobal: false,
		lastTabRightBorder: 0,
		lastTabClickedId: '',
	};

	private id = '';

	private tabsMap = new Map<string, React.RefObject<HTMLDivElement>>();

	private tabPanelRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();

	constructor(props: Props) {
		super(props);
		IpcServices.registerRemoteService(this, TABS_CONTAINER_CONTRACT);
	}

	public getBounds(): Promise<Rectangle> {
		const bounds = this.tabPanelRef?.current?.getBoundingClientRect() ?? defaultBounds;
		return Promise.resolve({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
	}

	public override async componentDidMount(): Promise<void> {
		const windowIdWaitDelay = 100;

		const waitForWindowId = async(): Promise<void> => {
			while (!this.context.windowId) {
				await sleep(windowIdWaitDelay);
			}
		};

		const registerDroppable = async(): Promise<void> => {
			try {
				const dragService = dragServiceProxy();
				await dragService.registerDroppable(this.id, this.context.windowId);

				loggerServiceProxy().debug(`TabPanel.componentDidMount(): "Registered droppable with id: ${ shortifyId(this.id) }"`);
			}
			catch (err) {
				loggerServiceProxy().error(`Could not register droppable ${ shortifyId(this.id) }`, err);
			}
		};

		if (!this.id) {
			this.id = IpcServices.registerRemoteObject(this, TABS_CONTAINER_CONTRACT);

			void waitForWindowId().then(() => {
				void registerDroppable();
				getWindowControl().registerTabPanel(this.id)
					.catch((error) => {
						loggerServiceProxy().error(
							`<TabPanel>.componentDidMount(): getWindowControl().registerTabPanel(id: ${ this.id })`,
							error
						);
					});
			});
		}

		const setShowLastTabCloseButton = async(): Promise<void> => {
			const windowCount = await windowServiceProxy().getCountWindows();
			this.setState({ isLastWindow: windowCount === 1 });

			this.windowCountSubscription = windowServiceProxy().chartWindowSubject.subscribe((count) => {
				this.setState({ isLastWindow: count === 1 });
			});
		};

		try {
			await setShowLastTabCloseButton();
		}
		catch (error) {
			loggerServiceProxy().error('<TabPanel>.componentDidMount(): setShowLastTabCloseButton() error', error);
		}
	}

	public override componentDidUpdate(): void {
		const lastTab = this.getLastTab();
		if (this.tabPanelRef?.current && lastTab) {
			this.tabPanelRef.current.scrollLeft = this.tabPanelRef.current.scrollWidth;

			const lastTabRightBorder = this.tabsMap.get(lastTab.id)?.current?.getBoundingClientRect().right;
			if (lastTabRightBorder && lastTabRightBorder !== this.state.lastTabRightBorder) {
				this.setState({ lastTabRightBorder });
			}
		}
	}

	public override componentWillUnmount(): void {
		IpcServices.unregisterRemoteObject(this.id);
		this.windowCountSubscription?.unsubscribe();
		this.windowCountSubscription = undefined;
	}

	@logCall
	public updateTabUrl(id: string, url: string): Promise<void> {
		this.setState((prevState) => ({
			...prevState,
			tabs: prevState?.tabs?.map((tab) => tab.id === id ? { ...tab, url } : tab) ?? [],
		}));

		return Promise.resolve();
	}

	@logCall
	public updateTabs(tabs: TabView[], resetMousePosition?: boolean): Promise<void> {
		if (tabs.length > 1) {
			const lastTab = tabs[tabs.length - 1];

			if (lastTab.offset) {
				lastTab.offset = this.normalizeOffset(lastTab.id, lastTab.offset, tabs);
			}
		}

		if (resetMousePosition) {
			this.mouseOverTab(null);
		}

		this.setState({ tabs });
		return Promise.resolve();
	}

	public override render(): JSX.Element {
		return (
			<div className='tabs' ref={ this.tabPanelRef }>
				{ this.state.tabs &&
					<div
						className='tabs-container'
						style={ { flexBasis: `${ this.state.tabs.length * TAB_FLEX_BASIS }px` } }
						onMouseLeave={ (): void => this.mouseLeave() }
					>
						{ this.renderTabs(this.state.tabs) }
					</div>
				}

				<CreateNewTabButton offset={ Math.round(this.state.lastTabRightBorder) } />

				<div id='placeholder' />
				<div
					className='draggable-area'
					onDoubleClick={ () => {
						getWindowControl().toggleMaximize()
							.catch((error) => {
								loggerServiceProxy().error('<TabPanel>.onDoubleClick(): getWindowControl().toggleMaximize() error', error);
							});
					} }
				/>
			</div>
		);
	}

	private mouseLeave(): void {
		getWindowControl().closeTooltip()
			.catch((error) => {
				loggerServiceProxy().error('<TabPanel>.mouseLeave(): getWindowControl().closeTooltip() error', error);
			});
		this.setState({ isTooltipVisibleGlobal: false });
		this.mouseOverTab(null);
	}

	private renderTabs(tabs: TabView[]): JSX.Element[] {
		const tabSize = getTabSize(tabs.length, this.tabPanelRef?.current?.scrollWidth ?? 0);

		return tabs.map((tab, index) =>
			<Tab
				key={ tab.id }
				setRef={ (ref) => this.setTabRef(tab.id, ref) }
				id={ tab.id }
				active={ tab.active }
				pinned={ tab.pinned }
				isChart={ tab.isChart ?? false }
				hideCloseTabButton={ this.state.isLastWindow && tabs.length === 1 }
				index={ index }
				offset={ tab.offset }
				initialWidth={ this.state.tabs?.length === 1 ? tab.width : undefined }
				tabSize={ tabSize }
				lastTabClickedId={ this.state.lastTabClickedId }
				setLastTabClickedId={ (id: string) => this.setState({ lastTabClickedId: id }) }
				tabsQuantity={ this.state.tabs ? this.state.tabs.length : null }
				isTooltipVisibleGlobal={ this.state.isTooltipVisibleGlobal }
				isTooltipVisibleGlobalChange={ (value): void => this.isTooltipVisibleGlobalChange(value) }
				mouseOverTab={ (idx): void => this.mouseOverTab(idx) }
				t={ this.props.t }
			/>
		);
	}

	private setTabRef(tabId: string, ref: React.RefObject<HTMLDivElement>): void {
		this.tabsMap.set(tabId, ref);
	}

	private getLastTab(): TabView | undefined {
		if (!this.state.tabs) {
			return;
		}

		if (this.state.tabs.length === 0) {
			return;
		}

		const tabsWidth = this.getRealTabsWidth();

		if (!tabsWidth) {
			return this.state.tabs[this.state.tabs.length - 1];
		}

		return this.state.tabs.reduce((prev, curr) => {
			if (!prev) {
				return curr;
			}

			const prevRect = this.tabsMap.get(prev.id)?.current?.getBoundingClientRect();
			const currRect = this.tabsMap.get(curr.id)?.current?.getBoundingClientRect();

			if (prevRect && currRect) {
				return prevRect.right > currRect.right ? prev : curr;
			}

			if (prevRect) {
				return prev;
			}

			return curr;
		});
	}

	private mouseOverTab(hoveredTabIndex: number | null): void {
		this.setState({ hoveredTabIndex });
	}

	private isTooltipVisibleGlobalChange(isTooltipVisibleGlobal: boolean): void {
		this.setState({ isTooltipVisibleGlobal });
	}

	private getTabPanelRightBound(): number | undefined {
		let tabPanelRightBound = this.tabPanelRef?.current?.getBoundingClientRect()?.right;

		if (tabPanelRightBound) {
			tabPanelRightBound -= MENU_LEFT_PADDING;
		}

		return tabPanelRightBound;
	}

	private getControlsAreaWidth(): ControlsAreaWidth | undefined {
		const tabsRef = this.tabPanelRef?.current;
		if (!tabsRef || !tabsRef.lastElementChild) {
			return;
		}

		const rightControlWidth = window.innerWidth - tabsRef.lastElementChild.getBoundingClientRect().right;
		const leftControlWidth = tabsRef.offsetLeft;
		return { leftControlWidth, rightControlWidth };
	}

	private getRealTabsWidth(): number | undefined {
		// finding placeholder element:
		// <tabs> (...) -> <placeholder> <- <draggablearea> </tabs>
		const prevEl = this.tabPanelRef?.current?.lastElementChild?.previousElementSibling;

		if (!prevEl) {
			return;
		}

		const tabsRightBound = prevEl.getBoundingClientRect().right;

		if (!tabsRightBound) {
			return;
		}
		return process.platform === 'darwin' ? tabsRightBound - this.getDarwinControlWidth() : tabsRightBound;
	}

	private getTabsWidth(): number | undefined {
		const lastTab = this.getLastTab();
		if (!lastTab) {
			return;
		}

		let lastTabWidth = this.tabsMap.get(lastTab.id)?.current?.getBoundingClientRect()?.right;

		if (!lastTabWidth) {
			return;
		}

		if (lastTab.offset) {
			lastTabWidth += lastTab.offset;
		}

		return process.platform === 'darwin' ? lastTabWidth - this.getDarwinControlWidth() : lastTabWidth;
	}

	/* #region  D&D */
	/* eslint-disable @typescript-eslint/no-unused-vars */
	public onDragStart(point: Position): void {}
	public onDragEnd(point: Position, target?: string): void {}
	/* eslint-enable @typescript-eslint/no-unused-vars */

	public async onDragOver(point: Position): Promise<void> {
		const tabState = this.state.tabs;
		const data = await this.getDragData();

		if (!tabState || !data || !this.state.prevCursorPoint) {
			return;
		}

		const tab = tabState.find(t => t.id === data.tabId);
		if (!tab) {
			this.attachTab(point.x, data.tabId);
			return;
		}

		if (this.state.tabs?.length === 1) {
			return;
		}

		const offsetX = point.x - this.state.prevCursorPoint.x;
		if (offsetX >= -1 && offsetX <= 1) {
			return;
		}

		const tabRef = this.tabsMap.get(data.tabId)?.current;

		if (!tabRef) {
			return;
		}

		// check if cursor is in bounds (by x)
		// using previous point as it matches currently rendered tab bounds
		const tabBounds = tabRef.getBoundingClientRect();

		if (tabBounds.left > this.state.prevCursorPoint.x || this.state.prevCursorPoint.x > tabBounds.right) {
			this.setState({ prevCursorPoint: point });
			return;
		}

		const tabPanelRightBound = this.getTabPanelRightBound();
		if (!tabPanelRightBound) {
			return;
		}

		const tabWidth = tabRef.offsetWidth;
		const tabLeft = tabRef.getBoundingClientRect().left;
		const realTabLeft = tabLeft - (tab.offset ?? 0);
		const paddingFromRightBorder = 25;

		tab.offset = this.getFittingOffset(offsetX + (tab.offset ?? 0), realTabLeft, tabWidth, tabPanelRightBound - paddingFromRightBorder);

		this.setState({ tabs: tabState, prevCursorPoint: point });
		this.onTabMove(data.tabId, { x: tabLeft, y: 0, width: tabWidth, height: WINDOW_HEADER_HEIGHT });
	}

	public async onDragEnter(point: Position): Promise<void> {
		console.log('drag enter');
		getWindowControl().bringToFront()
			.catch((error) => {
				loggerServiceProxy().error('<TabPanel>.onDragEnter(): getWindowControl().bringToFront() error', error);
			});
		const data = await this.getDragData();
		if (!data) {
			return;
		}

		if (this.state.tabs?.length === 1 && !!this.state.tabs.find(t => t.id === data.tabId)) {
			void tabDragHandlerProxy().startWindowDrag(this.context.windowId, data.tabId, point);
			return;
		}

		this.setState({ prevCursorPoint: point });
		this.attachTab(point.x, data.tabId);
	}

	public async onDragLeave(point: Position): Promise<void> {
		console.log('drag leave');
		if (!this.state.tabs || this.state.tabs.length === 1) {
			return;
		}

		const data = await this.getDragData();
		if (!data) {
			return;
		}

		const leavingTabBounds = this.tabsMap.get(data.tabId)?.current?.getBoundingClientRect();
		const panelRightBound = this.getTabPanelRightBound();
		if (!panelRightBound) {
			return;
		}

		if (leavingTabBounds) {
			const tabHalfWidth = Math.round(leavingTabBounds.width / 2);

			if (point.x >= panelRightBound - tabHalfWidth) {
				point.x = panelRightBound - tabHalfWidth;
			}
			else if (point.x <= 0) {
				point.x = tabHalfWidth;
			}
		}

		void tabDragHandlerProxy().dragTabOut(this.context.windowId, data.tabId, point, leavingTabBounds?.width, this.getControlsAreaWidth());
		this.resetTabsOffset();
	}

	public async onDrop(): Promise<void> {
		if (!this.state.tabs) {
			return;
		}

		const data = await this.getDragData();
		if (!data) {
			return;
		}

		const tabBounds = this.tabsMap.get(data.tabId)?.current?.getBoundingClientRect();

		if (!tabBounds) {
			return;
		}

		const tabCenter = tabBounds.left + tabBounds.width / 2;

		const oldTabIndex = this.state.tabs.findIndex(t => t.id === data.tabId);
		const newTabIndex = this.getTabIndexByCoordinate(tabCenter);

		loggerServiceProxy().debug(`<TabPanel>.onDrop(): "New tab index: ${ newTabIndex }, oldTabIndex: ${ oldTabIndex }"`);

		const resetTabsDebounceTime = 100;

		setTimeout(() => {
			getWindowControl().resetTabs()
				.catch((error) => {
					loggerServiceProxy().error('<TabPanel>.onDrop(): getWindowControl().resetTabs() error', error);
				});
			this.resetTabsOffset();
		}, resetTabsDebounceTime);

		if (oldTabIndex < 0 || newTabIndex < 0) {
			return;
		}

		if (oldTabIndex !== newTabIndex) {
			const { pinned } = this.state.tabs[oldTabIndex];

			this.onDropControllerToMoveTab({
				oldIndex: oldTabIndex,
				newIndex: newTabIndex,
				tabs: this.state.tabs,
				isPinned: pinned,
			})
				.catch((error) => {
					loggerServiceProxy().error('<TabPanel>.onDrop(): this.onDropControllerToMoveTab()', error);
				});
		}
	}

	private async onDropControllerToMoveTab({ oldIndex, newIndex, tabs, isPinned }: { oldIndex: number; newIndex: number; tabs: TabView[]; isPinned?: boolean; }): Promise<void> {
		let index = newIndex;
		const firstUnpinnedTab = tabs.findIndex(({ pinned }) => !pinned);

		if (isPinned) {
			if (firstUnpinnedTab !== -1 && newIndex >= firstUnpinnedTab) {
				index = firstUnpinnedTab - 1;
			}
			else if (newIndex >= tabs.length) {
				index = tabs.length - 1;
			}
		}
		else {
			if (newIndex < firstUnpinnedTab) {
				index = firstUnpinnedTab;
			}
			else if (newIndex >= tabs.length) {
				index = tabs.length - 1;
			}
		}

		this.mouseOverTab(index);
		await getWindowControl().moveTab(oldIndex, index);
	}

	private getTabIndexByCoordinate(x: number, tabsCount?: number): number {
		if (!this.state.tabs) {
			return -1;
		}

		const tabsWidth = this.getRealTabsWidth();

		if (!tabsWidth) {
			return -1;
		}

		const singleTabWidth = tabsWidth / (tabsCount ?? this.state.tabs.length);

		const relativeX = process.platform === 'darwin' ? x - this.getDarwinControlWidth() : x;
		const absoluteTabIndex = Math.floor(relativeX / singleTabWidth);

		return Math.min(absoluteTabIndex, tabsCount ?? this.state.tabs.length);
	}

	private resetTabsOffset(): void {
		this.isTooltipVisibleGlobalChange(false);
		this.setState((prevState) => ({ ...prevState, tabs: resetTabsOffset(prevState.tabs) as TabView[] }));
	}

	private onTabMove(tabId: string, rect: Rectangle): void {
		const tabState = this.state.tabs;
		if (!tabState) {
			return;
		}

		const hoveredTabIndex = Math.min(this.getHoveredTab(rect), tabState.length - 1);

		const newTabsState = moveTab(tabId, rect.width, hoveredTabIndex, tabState);

		if (!newTabsState) {
			return;
		}

		this.setState({ tabs: newTabsState.tabState as TabView[] });
	}

	private attachTab(x: number, tabId: string): void {
		const tabState = this.state.tabs;

		if (!tabState) {
			return;
		}

		const tab = tabState.find(t => t.id === tabId);
		if (tab) {
			loggerServiceProxy().debug('TabPanel.attachTab(): "Skipping tab attach, tab already belongs to current window"');
			return;
		}

		const tabsWidth = this.getTabsWidth();
		if (!tabsWidth) {
			return;
		}

		const tabsCount = tabState.length;
		const newTabIndex = this.getTabIndexByCoordinate(x, tabsCount + 1);
		if (newTabIndex < 0) {
			return;
		}

		loggerServiceProxy().debug(`TabPanel.attachTab(): "Tabswidth: ${ tabsWidth }, tabs count: ${ tabsCount }"`);

		let newTabOffset = 0;

		console.log(`newtabindex: ${ newTabIndex }, tabscount: ${ tabsCount }`);

		if (newTabIndex === tabsCount + 1) {
			newTabOffset = x - tabsWidth / (tabsCount + 1) / 2 - tabsWidth - darwinOffset;
			if (newTabOffset < 0) {
				newTabOffset = 0;
			}
		}
		void tabDragHandlerProxy().dragTabIn(this.context.windowId, newTabIndex, newTabOffset);
	}

	private getFittingOffset(offset: number, tabLeft: number, tabWidth: number, tabPanelRightBound: number): number {
		if (isDarwin() && this.context.windowStateSubject.value !== WindowState.Fullscreen && tabLeft + offset <= this.getDarwinControlWidth()) {
			return -tabLeft + this.getDarwinControlWidth();
		}
		else if (tabLeft + offset <= 0) {
			return -tabLeft;
		}
		else if (tabLeft + tabWidth + offset >= tabPanelRightBound) {
			const newOffset = tabPanelRightBound - tabLeft - tabWidth;
			return newOffset < 0 ? 0 : newOffset;
		}

		return offset;
	}

	private normalizeOffset(tabId: string, offset: number, tabs: TabView[]): number {
		loggerServiceProxy().debug(`TabPanel.normalizeOffset(): "will normalize tab offset ${ offset }"`);

		const tabRef = this.tabsMap.get(tabId)?.current;
		const tabsWidth = this.getTabsWidth();
		if (!tabsWidth) {
			return offset;
		}

		const tabPanelRightBound = this.getTabPanelRightBound();
		if (!tabPanelRightBound) {
			loggerServiceProxy().warn('TabPanel.normalizeOffset(): "No tab panel right bound"');
			return offset;
		}

		const renderedTabsCount = tabRef ? tabs.length : tabs.length - 1;
		const tabWidth = tabsWidth / renderedTabsCount;
		const tabLeft = !tabRef ? tabsWidth : tabRef.getBoundingClientRect().left;

		loggerServiceProxy()
			.debug(
				`TabPanel.normalizeOffset(): "Tab width: ${
					tabWidth
				}, tabs right bound: ${
					tabsWidth
				}, tab left: ${
					tabLeft
				}, tabs count: ${
					tabs.length
				}, panel right bound: ${
					tabPanelRightBound
				}"`
			);

		return this.getFittingOffset(offset, tabLeft, tabWidth, tabPanelRightBound);
	}

	private async getDragData(): Promise<TabDragData | undefined> {
		const dragService = dragServiceProxy();
		return dragService.getDragData<TabDragData>();
	}

	/* #endregion */

	/**
	 * @summary Returns tab index or -1 if tab is not hovering any neighbor tabs
	 */
	private getHoveredTab(rect: Rectangle): number {
		// calculating which tab in normal layout is hovered by rectangle center
		return this.getTabIndexByCoordinate(rect.x + rect.width / 2);
	}

	private getDarwinControlWidth(): number {
		return this.context.isRtlSystem ? 0 : DARWIN_CONTROLS_WIDTH;
	}
}

function getTabSize(tabsCount: number, panelWidth: number): TabSize {
	if (tabsCount === 0) {
		return TabSize.Normal;
	}

	const minMicroTabLength = 44;
	const minSmallestTabLength = 75;
	const minSmallTabLength = 110;

	const spaceForTab = panelWidth / tabsCount;

	if (spaceForTab <= minMicroTabLength) {
		return TabSize.XXSmall;
	}
	if (spaceForTab <= minSmallestTabLength) {
		return TabSize.XSmall;
	}
	if (spaceForTab <= minSmallTabLength) {
		return TabSize.Small;
	}

	return TabSize.Normal;
}
