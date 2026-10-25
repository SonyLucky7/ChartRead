import { TFunction } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { Icon } from '@tradingview/ui-lib/icon/icon';
import { svgIconburgerMenuSize28pxStroke1px as burgerMenuSvgIcon } from '@tradingview/ui-lib/icons/monochrome/burger-menu/size_28px__stroke_1px';
import { svgIcongearSize28pxStroke1pxTypeSimple as gearSvgIcon } from '@tradingview/ui-lib/icons/monochrome/gear/size_28px__stroke_1px__type_simple';
import { svgIconkeyboardSize28pxStroke1px as keyboardSvgIcon } from '@tradingview/ui-lib/icons/monochrome/keyboard/size_28px__stroke_1px';
import { svgIconnewTabSize18pxStroke1px as newTabSvgIcon } from '@tradingview/ui-lib/icons/monochrome/new-tab/size_18px__stroke_1px';
import { svgIconquestionSize28pxStroke1px as questionMarkInCircleSvgIcon } from '@tradingview/ui-lib/icons/monochrome/question/size_28px__stroke_1px';
import { DividerPopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/divider-popover-item/divider-popover-item';
import { PopoverItem, PopoverItemProps } from '@tradingview/ui-lib/popovers/popover/popover-items/popover-item/popover-item';
import { PopoverKeyboardNavigator } from '@tradingview/ui-lib/popovers/popover/popover-keyboard-navigator/popover-keyboard-navigator';
import { TooltipPlacements } from '@tradingview/ui-lib/tooltip';
import { TooltipStateless } from '@tradingview/ui-lib/tooltip/tooltip-stateless/tooltip-stateless';

import { loggerServiceProxy } from '../../../logger';
import { newTabServiceProxy } from '../../../services/new-tab';
import { settingsProviderProxy } from '../../../services/settings';
import { userServiceProxy } from '../../../services/user';
import { MenuCloseEventSource, RendererServiceData } from '../../../services/window/window-api';
import { getRendererInitialData, getWindowControl } from '../../common/app-common';
import { HotkeyModifiers } from '../../common/hotkey-hash';
import { HintReferenceable, HintReferenceableAlignment, HintReferenceablePosition } from '../../components-ui/hint-referenceable/hint-referenceable';
import { useObservable, useOutsideClick, useTVHost } from '../../components-ui/hooks';
import { getBlocksHotkeysDataAttributes } from '../../components-ui/hooks/use-hotkeys';
import { AppOnboardingLaunchSource } from '../../dialog-window/welcome-dialog/constants';
import { isOpenPageInNewTab } from '../new-product-tab';
// TODO: replace to monochrome icons when possible
import { redditSvgIcon } from './support-button/assets/reddit';
import { shiningWindowSvgIcon } from './support-button/assets/shining-window';

import './support-button.css';

interface GetMenuItemsOptions {
	t: TFunction;
	onClose(): void;
	tvHost: string;
	// TODO: remove in TVD-3013
	isTvMcpServerFeatureEnabled: boolean;
}

interface MenuItemInfo extends Pick<PopoverItemProps, 'leftSlot' | 'title' | 'onClick' | 'hotkey' | 'rightSlot'> {
	type: MenuItemType;
}

interface SupportButtonProps {
	isHintShown: boolean;
	onHintClose(): void;
	isTvMcpServerFeatureEnabled: boolean;
}

const enum MenuItemType {
	Common = 'common',
	Separator = 'separator',
	Empty = 'empty',
}

function isMouseClick(ev: React.MouseEvent | React.KeyboardEvent): ev is React.MouseEvent {
	return ev.type === 'click';
}

// TODO: remove isTvMcpFeatureEnabled in TVD-3013
function getMenuItems({ t, onClose, tvHost, isTvMcpServerFeatureEnabled }: GetMenuItemsOptions): MenuItemInfo[] {
	const { tabId } = getRendererInitialData<RendererServiceData>();

	const openLink = (ev: React.MouseEvent | React.KeyboardEvent, title: string, url: string): void => {
		const shouldOpenInNewTab = isMouseClick(ev) ? isOpenPageInNewTab(ev) : false;

		newTabServiceProxy().loadURL(
			{
				tabId,
				title,
				url,
			},
			shouldOpenInNewTab,
		);

		if (shouldOpenInNewTab) {
			onClose();
		}
	};

	const settings: MenuItemInfo = {
		type: MenuItemType.Common,
		leftSlot: <BlockIcon icon={ gearSvgIcon } />,
		title: t('Settings...'),
		onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
			ev.preventDefault();
			ev.stopPropagation();

			settingsProviderProxy().showSettings({ tabId })
				.catch((error) => {
					loggerServiceProxy().error('<SupportButton>.getMenuItems(): settingsProviderProxy().showSettings() error', error);
				});

			onClose();
		},
		hotkey: HotkeyModifiers.CtrlOrCmd + ','.charCodeAt(0),
	};

	const onboarding: MenuItemInfo = {
		type: MenuItemType.Common,
		leftSlot: <BlockIcon icon={ shiningWindowSvgIcon } />,
		title: t('App onboarding...'),
		onClick: () => {
			userServiceProxy().showAppOnboardingDialog(AppOnboardingLaunchSource.LaunchedByUser, tabId)
				.catch((error) => {
					loggerServiceProxy().error('<SupportMenuBase>.getMenuItems(): userServiceProxy().showAppOnboardingDialog() error', error);
				});

			onClose();
		},
	};

	const helpCenter: MenuItemInfo = {
		type: MenuItemType.Common,
		leftSlot: <BlockIcon icon={ questionMarkInCircleSvgIcon } />,
		title: t('Help Center'),
		onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
			openLink(ev, t('Help Center'), `${ tvHost }support/`);
		},
	};

	const keyboardShortcuts: MenuItemInfo = {
		type: MenuItemType.Common,
		leftSlot: <BlockIcon icon={ keyboardSvgIcon } />,
		title: t('Keyboard shortcuts'),
		onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
			openLink(ev, t('Keyboard shortcuts'), `${ tvHost }support/shortcuts/`);
		},
	};

	const releaseNotes: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('Release notes'),
		onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
			openLink(
				ev,
				t('Release notes'),
				`${ tvHost }support/solutions/43000673888-tradingview-desktop-releases-and-release-notes/`
			);
		},
	};

	const houseRules: MenuItemInfo = {
		type: MenuItemType.Common,
		title: t('House rules'),
		onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
			openLink(ev, t('House rules'), `${ tvHost }house-rules/`);
		},
	};

	// TODO: remove isTvMcpServerFeatureEnabled in TVD-3013
	const tvMcp: MenuItemInfo = isTvMcpServerFeatureEnabled
		? {
			type: MenuItemType.Common,
			title: t('MCP Server'),
			onClick: (ev: React.MouseEvent | React.KeyboardEvent) => {
				openLink(
					ev,
					t('MCP Server'),
					'https://www.tradingview.com/mcp/docs',
				);
			},
		}
		: { type: MenuItemType.Empty };

	const featureRequest: MenuItemInfo = {
		type: MenuItemType.Common,
		leftSlot: <BlockIcon icon={ redditSvgIcon } />,
		title: t('Request a feature'),
		onClick: () => {
			window.open('https://www.reddit.com/r/TradingView/');

			onClose();
		},
		rightSlot: <BlockIcon icon={ newTabSvgIcon } />,
	};

	const separator: MenuItemInfo = { type: MenuItemType.Separator };

	return [
		settings,
		onboarding,
		separator,
		helpCenter,
		keyboardShortcuts,
		releaseNotes,
		houseRules,
		tvMcp,
		separator,
		featureRequest,
	];
}

const MenuItem = ({ type, ...props }: MenuItemInfo): JSX.Element => {
	switch (type) {
		case MenuItemType.Empty: {
			return <></>;
		}
		case MenuItemType.Separator: {
			return <DividerPopoverItem />;
		}
		default: {
			return <PopoverItem { ...props } />;
		}
	}
};

export const SupportButton = ({ isHintShown, onHintClose, isTvMcpServerFeatureEnabled }: SupportButtonProps): JSX.Element => {
	const { t } = useTranslation();

	const supportButtonRef = useRef<HTMLButtonElement>(null);
	const supportMenuRef = useRef<HTMLDivElement>(null);

	const { tvHost } = useTVHost();

	const [isMenuOpened, setIsMenuOpened] = useState<boolean>(false);
	const [menuItems, setMenuItems] = useState<MenuItemInfo[]>([]);

	const [isTooltipShown, setIsTooltipShown] = useState<boolean>(false);

	const resetMenu = (): void => {
		setIsMenuOpened(false);
	};

	useObservable<MenuCloseEventSource>(getWindowControl().menuCloseEvent, resetMenu);

	useEffect(() => {
		setMenuItems(
			getMenuItems({
				t,
				tvHost,
				onClose: resetMenu,
				// TODO: remove in TVD-3013
				isTvMcpServerFeatureEnabled,
			})
		);
	}, [isTvMcpServerFeatureEnabled, t, tvHost]);

	useOutsideClick<HTMLDivElement>(
		supportMenuRef,
		isMenuOpened,
		resetMenu,
		{
			escape: true,
			scroll: true,
			resize: true,
		}
	);

	const handleMenuClick = (): void => {
		onHintClose();

		setIsTooltipShown(false);
		setIsMenuOpened(true);
	};

	return (
		<>
			<HintReferenceable
				onAccept={ onHintClose }
				isShown={ isHintShown }
				text={ t('Set up TradingView MCP Server') }
				position={ HintReferenceablePosition.Left }
				alignment={ HintReferenceableAlignment.End }
				className='support-menu-button-hint'
			>
				<button
					onClick={ handleMenuClick }
					className='sided-action-button support-menu-button'
					ref={ supportButtonRef }
					onMouseEnter={ () => { setIsTooltipShown(true); } }
					onMouseLeave={ () => { setIsTooltipShown(false); } }
				>
					<BlockIcon icon={ burgerMenuSvgIcon } className='support-menu-button-icon' />
				</button>
			</HintReferenceable>

			<TooltipStateless
				id='support-menu-tooltip'
				open={ isTooltipShown && !isMenuOpened }
				onClose={ () => {} }
				content={ t('Help and resources') }
				anchor={ supportButtonRef }
				placement={ TooltipPlacements.Left }
			/>

			<PopoverKeyboardNavigator
				refToContentWrapperElement={ supportMenuRef }
				isOpen={ isMenuOpened }
				onClose={ () => {} }
				anchored={ {
					type: 'element',
					at: supportButtonRef,
				} }
				closeOnTab={ false }
				placementRules={ [
					{
						anchorPoint: { x: 1, y: 0 },
						contentPoint: { x: 1, y: 1 },
						offset: { x: 0, y: -12 },
					},
				] }
				focusFirstItemOnOpen={ false }
				{ ...getBlocksHotkeysDataAttributes() }
			>
				{ menuItems.map((item, index) =>
					<MenuItem { ...item } leftSlot={ item.leftSlot ?? <Icon /> } key={ index } />
				) }
			</PopoverKeyboardNavigator>
		</>
	);
};
