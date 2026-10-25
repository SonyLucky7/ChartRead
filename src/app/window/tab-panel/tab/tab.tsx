import { TFunction } from 'i18next';
import React, { Component } from 'react';
import { ClickableIconButton } from '@tradingview/ui-lib/buttons/icon-button';
import { svgIconcrossWebSize18pxStroke1px as crossSvgIcon } from '@tradingview/ui-lib/icons/monochrome/cross-web/size_18px__stroke_1px';

import { IpcServices } from '../../../../ipc-services';
import { loggerServiceProxy } from '../../../../logger';
import { logCall, logCallName } from '../../../../logger/log-decorator';
import { shortifyId } from '../../../../logger/log-formatter';
import { TAB_CONTRACT } from '../../../../services/contracts';
import { defaultBounds, dragServiceProxy, IElement } from '../../../../services/native-drag-service';
import { ITabController, TabTitleView, TabTitleViewType, TooltipRequestType } from '../../../../services/window/window-api';
import { ignorePromise, Position, Rectangle } from '../../../../utils';
import { getWindowControl } from '../../../common/app-common';
import { LinkColor, linkPallette } from '../../../common/linking-colors';
import { WindowEventsContext } from '../../../common/react-common';
import { TabPanelDivider } from '../../tab-panel-divider';
import { TabDragData, TabSize } from '../tab-utils';
import { Extenders } from './extenders';
import { TabTitle } from './tab-title';

import './tab.css';

const TAB_FULL_WIDTH = 224;

IpcServices.initializeRpc();

interface TabProps {
	id: string;
	index: number;
	active: boolean;
	t: TFunction;
	tabsQuantity: number | null;
	tabSize: TabSize;
	lastTabClickedId: string;
	isChart: boolean;
	isTooltipVisibleGlobal: boolean;
	isTooltipVisibleGlobalChange(value: boolean): void;
	setRef(ref: React.RefObject<HTMLDivElement>): void;
	setLastTabClickedId(id: string): void;
	mouseOverTab(index: number | null): void;
	hideCloseTabButton: boolean;
	initialWidth?: number;
	offset?: number;
	pinned?: boolean;
}

interface State {
	title: TabTitleView;
	linkColor: LinkColor | null;
	prevCursorPoint?: Position;
}

const ANIMATION_FRAME_AMOUNT = 10;
const ANIMATION_FRAME_TIMEOUT = 4;
const SHOW_TOOLTIP_ON_MOUSE_OVER_TIMEOUT = 1000;

@logCallName('Tab')
export class Tab extends Component<TabProps, State> implements ITabController, IElement {
	static override contextType = WindowEventsContext;
	declare context: React.ContextType<typeof WindowEventsContext>;

	private remoteServiceInstanceId?: string;
	private tabRef?: React.RefObject<HTMLDivElement>;
	private timeoutOnMouseOver?: number;

	public override state: State = {
		title: { type: TabTitleViewType.Basic, title: '' },
		linkColor: null,
	};

	public override componentDidMount(): void {
		this.tabRef = React.createRef<HTMLDivElement>();

		this.props.setRef(this.tabRef);

		const registerDraggable = async(): Promise<void> => {
			if (!this.remoteServiceInstanceId) {
				return;
			}
			try {
				const dragService = dragServiceProxy();
				await dragService.registerDraggable(this.remoteServiceInstanceId, this.context.windowId);
				loggerServiceProxy().debug(`<Tab>.componentDidMount(): "registered draggable with id ${ shortifyId(this.remoteServiceInstanceId) }"`);
			}
			catch (err) {
				loggerServiceProxy().error(`Could not register draggable ${ this.remoteServiceInstanceId }`, err);
			}
		};

		if (!this.remoteServiceInstanceId) {
			this.remoteServiceInstanceId = IpcServices.registerRemoteObject(this, TAB_CONTRACT);

			getWindowControl().registerTabController(this.props.id, this.remoteServiceInstanceId)
				.then(() => loggerServiceProxy().debug(`<Tab>.componentDidMount(): "registered controller for tab ${ shortifyId(this.remoteServiceInstanceId) }"`))
				.catch((err) => loggerServiceProxy().error(`Failed to register tab controller for ${ shortifyId(this.remoteServiceInstanceId) }`, err));

			ignorePromise(registerDraggable());
		}

		this.context.windowResizeSubject.subscribe(() => {
			this.hideTooltipHandler();
		});
	}

	public override componentWillUnmount(): void {
		loggerServiceProxy().debug(`<Tab>.componentWillUnmount(): "Unmounting ${ shortifyId(this.remoteServiceInstanceId) }"`);
		if (this.remoteServiceInstanceId) {
			IpcServices.unregisterRemoteObject(this.remoteServiceInstanceId);
		}
		clearTimeout(this.timeoutOnMouseOver);
	}

	public override shouldComponentUpdate(nextProps: Readonly<TabProps>): boolean {
		return this.props.isTooltipVisibleGlobal === nextProps.isTooltipVisibleGlobal;
	}

	public getBounds(): Promise<Rectangle> {
		const bounds = this.tabRef?.current?.getBoundingClientRect() ?? defaultBounds;

		return Promise.resolve({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) });
	}

	public setTitle(title: TabTitleView): Promise<void> {
		this.setState({ title });

		return Promise.resolve();
	}

	public setLinkColor(linkColor: LinkColor | null): void {
		// Null means no color (removes visual color assignment on tab)
		// I think we should consider explicit 'noColor' value.
		this.setState({ linkColor });
	}

	@logCall
	private closeTab(ev: React.MouseEvent, tabId: string): void {
		ev.stopPropagation();
		this.props.mouseOverTab(null);
		this.props.setLastTabClickedId(tabId);

		getWindowControl().closeTab(tabId, { silent: false, addToHistory: true })
			.catch((error) => {
				loggerServiceProxy().error('<Tab>.closeTab(): getWindowControl().closeTab() error', error);
			});
	}

	@logCall
	private changeActiveTab(id: string): void {
		this.hideTooltipHandler();
		if (this.props.active) {
			return;
		}

		getWindowControl().changeTab(id)
			.catch((error) => {
				loggerServiceProxy().error(`<Tab>.changeActiveTab(): getWindowControl().changeTab(id: ${ id }) error`, error);
			});
		getWindowControl().activateTooltip(true)
			.catch((error) => {
				loggerServiceProxy().error('<Tab>.changeActiveTab(): getWindowControl().activateTooltip() error', error);
			});
	}

	@logCall
	private duplicateActiveTab(id: string): void {
		this.hideTooltipHandler();
		getWindowControl().duplicateTab(id)
			.catch((error) => {
				loggerServiceProxy().error(`<Tab>.duplicateActiveTab(): getWindowControl().duplicateTab(id: ${ id }) error`, error);
			});
	}

	@logCall
	private tabClick({ detail }: React.MouseEvent): void {
		const { id, lastTabClickedId, setLastTabClickedId } = this.props;

		if (detail === 2 && lastTabClickedId === id) {
			this.duplicateActiveTab(id);
			return;
		}

		setLastTabClickedId(id);
		this.changeActiveTab(id);
	}

	@logCall
	private htmlDragStart(ev: React.DragEvent): void {
		ev.preventDefault();

		if (!this.remoteServiceInstanceId) {
			return;
		}

		getWindowControl().triggerMenuCloseEvent('tab-panel-click');

		dragServiceProxy().startDrag(this.remoteServiceInstanceId)
			.catch((error) => {
				loggerServiceProxy().warn(`IDragService.startDrag(${ JSON.stringify(this.remoteServiceInstanceId) }): ${ JSON.stringify(error) }`);
			});
	}

	@logCall
	public onDragStart(point: Position): void {
		this.hideTooltipHandler();

		if (this.timeoutOnMouseOver) {
			clearTimeout(this.timeoutOnMouseOver);
		}

		console.log('tab drag start');
		if (!this.props.active) {
			this.changeActiveTab(this.props.id);
		}

		const initialCursorPosition: Position = {
			x: point.x,
			y: point.y,
		};

		this.setState({
			prevCursorPoint: initialCursorPosition,
		});

		if (!this.context.windowId) {
			return;
		}

		const dragData: TabDragData = {
			tabId: this.props.id,
		};

		const dragService = dragServiceProxy();
		dragService.setDragData(dragData).catch(err => {
			loggerServiceProxy().warn(`IDragService.setDragData(${ JSON.stringify(dragData) }): ${ JSON.stringify(err) }`);
		});
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */
	public onDragEnd(point: Position, target?: string): void {}
	public onDragOver(point: Position): void {}
	public onDragEnter(point: Position): void {}
	public onDragLeave(point: Position): void {}
	public onDrop(point: Position): void {}
	/* eslint-enable @typescript-eslint/no-unused-vars */

	@logCall
	private showMenu(ev: React.MouseEvent<HTMLDivElement>): void {
		if (this.timeoutOnMouseOver) {
			clearTimeout(this.timeoutOnMouseOver);
		}
		this.timeoutOnMouseOver = undefined;
		this.hideTooltipHandler();
		getWindowControl().showTabMenu(this.props.id, ev.shiftKey, { x: ev.clientX, y: ev.clientY });
	}

	private mouseUp(ev: React.MouseEvent): void {
		if (ev.button === 1) {
			ev.stopPropagation();

			this.hideTooltipHandler();
			getWindowControl().closeTab(this.props.id)
				.catch((error) => {
					loggerServiceProxy().error('<Tab>.mouseUp(): getWindowControl().closeTab() error', error);
				});
		}
	}

	private updateTooltipBounds(): void {
		const tabRefCurrent = this.tabRef?.current;

		if (!tabRefCurrent || !this.context.windowFocused) {
			return;
		}
		getWindowControl().setTooltipOffset(tabRefCurrent.offsetLeft);
	}

	private async moveTooltip(): Promise<void> {
		if (!this.props.isChart) {
			this.hideTooltipHandler();
			return;
		}

		this.updateTooltipBounds();
		const tooltipText = this.state.title;

		getWindowControl().setTooltipText({
			text: tooltipText,
			type: TooltipRequestType.Move,
		});
		await getWindowControl().moveTooltip(ANIMATION_FRAME_AMOUNT, ANIMATION_FRAME_TIMEOUT, this.props.active);
		getWindowControl().setTooltipText({
			text: tooltipText,
			type: TooltipRequestType.Show,
		});
	}

	private async showTooltipHandler(): Promise<void> {
		const tabBounds = await this.getBounds();

		if (!this.context.windowFocused || tabBounds.width > TAB_FULL_WIDTH || !this.props.isChart) {
			return;
		}
		const tooltipText = this.state.title;
		getWindowControl().setTooltipText({ text: tooltipText, type: TooltipRequestType.Show });

		this.updateTooltipBounds();

		if (this.tabRef && this.tabRef.current) {
			getWindowControl().activateTooltip(this.props.active);
			getWindowControl().showTooltip(this.props.id);
		}
	}

	private hideTooltipHandler(): void {
		this.props.isTooltipVisibleGlobalChange(false);
		void getWindowControl().closeTooltip();
	}

	private mouseEnter(e: React.MouseEvent): void {
		if (this.timeoutOnMouseOver) {
			clearTimeout(this.timeoutOnMouseOver);
		}

		if (this.props.isTooltipVisibleGlobal) {
			ignorePromise(this.moveTooltip());
		}
		else {
			const tooltipTimerHandler: TimerHandler = async() => {
				await this.showTooltipHandler();
				this.props.isTooltipVisibleGlobalChange(true);
			};

			this.timeoutOnMouseOver = setTimeout(tooltipTimerHandler, SHOW_TOOLTIP_ON_MOUSE_OVER_TIMEOUT);
		}

		// in order not to make a request to the drag service, we get the state of the mouse buttons here
		// to prevent unnecessary hover effects on tabs
		if (e.buttons) {
			return;
		}

		this.props.mouseOverTab(this.props.index);
	}

	private mouseLeave(): void {
		if (this.timeoutOnMouseOver) {
			clearTimeout(this.timeoutOnMouseOver);
		}
		this.timeoutOnMouseOver = undefined;
	}

	public override render(): JSX.Element {
		const tabStyle = this.getTabStyle();
		const showCloseTabButton = !this.props.pinned && !this.props.hideCloseTabButton && (this.props.active || this.props.tabSize === TabSize.Normal);

		return (
			<div
				id={ this.props.id }
				className={ `tab ${ this.props.active ? 'active' : '' } ${ this.props.tabSize }` }
				draggable
				onDragStart={ (ev): void => this.htmlDragStart(ev) }
				onMouseEnter={ (ev): void => this.mouseEnter(ev) }
				onMouseLeave={ (): void => this.mouseLeave() }
				onClick={ (ev) => this.tabClick(ev) }
				onMouseUp={ (ev: React.MouseEvent): void => this.mouseUp(ev) }
				onContextMenuCapture={ () => {
					getWindowControl().triggerMenuCloseEvent('tab-context-menu')
						.catch((error) => {
							loggerServiceProxy().error('<Tab>.onContextMenuCapture(): getWindowControl().triggerMenuCloseEvent() error', error);
						});
				} }
				onContextMenu={ (ev): void => this.showMenu(ev) }
				style={ tabStyle }
				key={ this.props.id }
				ref={ this.tabRef }
			>
				<div className='tab-link-indicator' style={ this.getTabLinkingColor() }></div>

				<div className={ `tab-title ${ this.props.tabSize }` }>
					<TabTitle
						title={ this.state.title }
						isLogoVisible
						active={ this.props.active }
						t={ this.props.t }
					/>
				</div>

				<div className='tab-close-button-container'>
					<div className='fadeout' />

					{ showCloseTabButton &&
						<ClickableIconButton
							title={ this.props.t('Close') }
							icon={ crossSvgIcon }
							onClick={ (ev) => { this.closeTab(ev, this.props.id); } }
							colorClassName='tab-close-button'
							tabIndex={ -1 }
						/>
					}
				</div>

				<TabPanelDivider />

				<Extenders />
			</div>
		);
	}

	private getTabLinkingColor(): React.CSSProperties | undefined {
		if (this.state.linkColor === null) {
			return;
		}

		const linkColor = linkPallette.get(this.state.linkColor);

		if (linkColor === undefined) {
			return;
		}

		return { backgroundColor: linkColor.backgroundColor };
	}

	private getTabStyle(): React.CSSProperties {
		const tabStyle: React.CSSProperties = {};

		if (!this.props.active && typeof this.props.offset !== 'undefined') {
			// inactive tabs with offset should have animation
			tabStyle.transition = 'transform 0.2s ease-out';
		}

		if (this.props.offset) {
			const shift = Math.round(this.props.offset);
			tabStyle.transform = `translate(${ shift || 0 }px, 0px)`;
		}

		if (this.props.initialWidth) {
			tabStyle.flexBasis = this.props.initialWidth;
		}

		return tabStyle;
	}
}
