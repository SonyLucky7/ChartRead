import { TFunction } from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { svgIconalertSize28pxStroke1 as alertBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/alert/size_28px__stroke_1.5px__type_alert';
import { svgIconalertSize28pxStroke1pxTypeAlert as alertSvgIcon } from '@tradingview/ui-lib/icons/monochrome/alert/size_28px__stroke_1px__type_alert';
import { svgIconexpandPanelSize28pxStroke1 as expandPanelBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/expand-panel/size_28px__stroke_1.5px__type_bottom';
import { svgIconexpandPanelSize28pxStroke1pxTypeBottom as expandPanelSvgIcon } from '@tradingview/ui-lib/icons/monochrome/expand-panel/size_28px__stroke_1px__type_bottom';
import { svgIconglobeSize28pxStroke1 as globeBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/globe/size_28px__stroke_1.5px';
import { svgIconglobeSize28pxStroke1px as globeSvgIcon } from '@tradingview/ui-lib/icons/monochrome/globe/size_28px__stroke_1px';
import { svgIconinformationSize28pxStroke1 as informationBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/information/size_28px__stroke_1.5px__type_circle';
import { svgIconinformationSize28pxStroke1pxTypeCircle as informationSvgIcon } from '@tradingview/ui-lib/icons/monochrome/information/size_28px__stroke_1px__type_circle';
import { svgIconlaptopSize28pxStroke1 as laptopBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/laptop/size_28px__stroke_1.5px';
import { svgIconlaptopSize28pxStroke1px as laptopSvgIcon } from '@tradingview/ui-lib/icons/monochrome/laptop/size_28px__stroke_1px';
import { svgIconvideoCameraSize28pxStroke1 as videoBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/video-camera/size_28px__stroke_1.5px';
import { svgIconvideoCameraSize28pxStroke1pxTypeOn as videoSvgIcon } from '@tradingview/ui-lib/icons/monochrome/video-camera/size_28px__stroke_1px__type_on';
import { svgIconwrenchSize28pxStroke1 as wrenchBoldSvgIcon } from '@tradingview/ui-lib/icons/monochrome/wrench/size_28px__stroke_1.5px';
import { svgIconwrenchSize28pxStroke1px as wrenchSvgIcon } from '@tradingview/ui-lib/icons/monochrome/wrench/size_28px__stroke_1px';

import { loggerService } from '../../../logger';
import { BuildInfo } from '../../../services/interfaces';
import { localeServiceProxy } from '../../../services/locale';
import { settingsProviderProxy } from '../../../services/settings';
import { DefaultSystemNameTab } from '../../../services/settings/settings-tabs';
import { RendererServiceData } from '../../../services/window/window-api';
import { isLinux, KeyboardEventKey } from '../../../utils';
import { getRendererInitialData } from '../../common/app-common';
import { NavigationKeys } from '../../common/interfaces';
import { useObservable } from '../../components-ui/hooks';
import { Icon } from '../../components-ui/icon';
import { About } from './about';
import { AlertsSettings } from './alerts-settings';
import { AudioVideoSettings } from './audio-video-settings';
import { GeneralSettings } from './general-settings';
import { NetworkSettings } from './network-settings';
import { ServiceSettings } from './service-settings';
import { CLEAR_CACHE_BUTTON_ID, FACTORY_RESET_BUTTON_ID, HARDWARE_ACCELERATION_CHECKBOX_ID } from './service-settings/service-settings';
import { SettingsTab } from './settings-tab';
import { SettingsWarning } from './settings-warning';
import { TabSettings } from './tab-settings';

import './settings-dialog.css';

export interface SettingsWindowData extends RendererServiceData {
	currentActiveTab: DefaultSystemNameTab;
	buildInfo: BuildInfo;
}

interface Tab {
	systemName: DefaultSystemNameTab;
	name: string;
	icon: JSX.Element;
	iconSelected: JSX.Element;
	isVisible: boolean;
}

function getTabs(t: TFunction): Tab[] {
	return [
		{
			systemName: DefaultSystemNameTab.General,
			name: t('General'),
			icon: <Icon icon={ laptopSvgIcon } />,
			iconSelected: <Icon icon={ laptopBoldSvgIcon } />,
			isVisible: true,
		},
		{
			systemName: DefaultSystemNameTab.Tab,
			name: t('Tabs'),
			icon: <Icon icon={ expandPanelSvgIcon } />,
			iconSelected: <Icon icon={ expandPanelBoldSvgIcon } />,
			isVisible: true,
		},
		{
			systemName: DefaultSystemNameTab.VideoAudio,
			name: t('Video & Audio'),
			icon: <Icon icon={ videoSvgIcon } />,
			iconSelected: <Icon icon={ videoBoldSvgIcon } />,
			isVisible: true,
		},
		{
			systemName: DefaultSystemNameTab.Alerts,
			name: t('Alerts'),
			icon: <Icon icon={ alertSvgIcon } />,
			iconSelected: <Icon icon={ alertBoldSvgIcon } />,
			isVisible: true,
		},
		{
			systemName: DefaultSystemNameTab.Service,
			name: t('Service'),
			icon: <Icon icon={ wrenchSvgIcon } />,
			iconSelected: <Icon icon={ wrenchBoldSvgIcon } />,
			isVisible: true,
		},
		{
			systemName: DefaultSystemNameTab.Network,
			name: t('Network'),
			icon: <Icon icon={ globeSvgIcon } />,
			iconSelected: <Icon icon={ globeBoldSvgIcon } />,
			isVisible: !isLinux(),
		},
		{
			systemName: DefaultSystemNameTab.About,
			name: t('About'),
			icon: <Icon icon={ informationSvgIcon } />,
			iconSelected: <Icon icon={ informationBoldSvgIcon } />,
			isVisible: true,
		},
	];
}

const getFilteredTabs = (t: TFunction): Tab[] => getTabs(t).filter(({ isVisible }) => isVisible);

export const SettingsDialog = (): JSX.Element => {
	const { t } = useTranslation();

	const [tabs, setTabs] = useState<Tab[]>(getFilteredTabs(t));
	const [currentTab, setCurrentTab] = useState<DefaultSystemNameTab>(getRendererInitialData<SettingsWindowData>().currentActiveTab ?? DefaultSystemNameTab.General);
	const [tabsFocusable, setTabsFocusable] = useState<boolean>(false);

	const [warningText, setWarningText] = useState<string | null>(null);
	const [isErrorWarning, setIsErrorWarning] = useState<boolean>(false);
	const [isLoaderShowing, setIsLoaderShowing] = useState<boolean>(false);
	const [customButtonText, setCustomButtonText] = useState<string | null>(null);
	const [warningCallback, setWarningCallback] = useState<(() => void) | null>(null);

	useObservable<string>(localeServiceProxy().localeChange, (): void => {
		setTabs(getFilteredTabs(t));
	});

	const resetRelaunchWarning = useCallback((): void => {
		setWarningText(null);
		setCustomButtonText(null);
		setWarningCallback(null);
		setIsErrorWarning(false);
		setIsLoaderShowing(false);
	}, []);

	useEffect(() => {
		const changeTab = (tab: HTMLElement, indexTab: number): void => {
			const currentTabDOM = tab.tagName === 'BODY'
				? tab.querySelectorAll('.tab')[indexTab]
				: tab.parentElement?.children.item(indexTab);

			if (currentTabDOM instanceof HTMLElement) {
				currentTabDOM.focus();
			}

			setCurrentTab(tabs[indexTab].systemName);
		};

		const keyDownArrowHandler = (ev: KeyboardEvent): void => {
			if (Object.values(NavigationKeys).includes(ev.key as NavigationKeys)) {
				if (
					ev.target instanceof HTMLElement &&
					(ev.target.dataset.category === 'settings' || ev.target.tagName === 'BODY')
				) {
					ev.preventDefault();

					const indexActiveTab = tabs.findIndex((tab) => tab.systemName === currentTab);

					switch (ev.key) {
						case NavigationKeys.Down:
						case NavigationKeys.Right: {
							const nextIndexTab = indexActiveTab === tabs.length - 1 ? 0 : indexActiveTab + 1;
							changeTab(ev.target, nextIndexTab);
							break;
						}
						case NavigationKeys.Up:
						case NavigationKeys.Left: {
							const previousIndexTab = indexActiveTab - 1 >= 0 ? indexActiveTab - 1 : tabs.length - 1;
							changeTab(ev.target, previousIndexTab);
							break;
						}
					}

					resetRelaunchWarning();
				}
			}
			else if (
				ev.code === KeyboardEventKey.Tab &&
				ev.target instanceof HTMLElement &&
				ev.target.tagName !== 'BODY'
			) {
				if (!tabsFocusable) {
					setTabsFocusable(true);
				}
			}
		};

		document.addEventListener('keydown', keyDownArrowHandler);

		return () => {
			document.removeEventListener('keydown', keyDownArrowHandler);
		};
	}, [currentTab, resetRelaunchWarning, tabs, tabsFocusable]);

	const closeConfirmationWarning = (ev: React.SyntheticEvent): void => {
		if (currentTab !== DefaultSystemNameTab.Service) {
			return;
		}

		if (ev.target instanceof HTMLElement) {
			const disableAccelerationCheckbox = document.querySelector(`#${ HARDWARE_ACCELERATION_CHECKBOX_ID }`);
			const clearCacheButton = document.querySelector(`#${ CLEAR_CACHE_BUTTON_ID }`);
			const factoryResetButton = document.querySelector(`#${ FACTORY_RESET_BUTTON_ID }`);

			if (
				disableAccelerationCheckbox?.contains(ev.target) ||
				clearCacheButton?.contains(ev.target) ||
				factoryResetButton?.contains(ev.target)
			) {
				return;
			}
		}

		resetRelaunchWarning();
	};

	const handleTabClick = (tab: DefaultSystemNameTab): void => {
		setCurrentTab(tab);

		settingsProviderProxy().setCurrentSettingsActiveTab(tab)
			.catch((error) => {
				loggerService().error(
					'<SettingsDialog>.onTabClick(): settingsProviderProxy().setCurrentSettingsActiveTab() error',
					error
				);
			});
	};

	const renderTabContent = (): React.ReactNode => {
		switch (currentTab) {
			case DefaultSystemNameTab.General: {
				return <GeneralSettings />;
			}
			case DefaultSystemNameTab.Tab: {
				return <TabSettings />;
			}
			case DefaultSystemNameTab.VideoAudio: {
				return <AudioVideoSettings />;
			}
			case DefaultSystemNameTab.Alerts: {
				return <AlertsSettings />;
			}
			case DefaultSystemNameTab.Service: {
				return (
					<ServiceSettings
						setWarningText={ setWarningText }
						setWarningCallback={ setWarningCallback }
						setIsLoaderShowing={ setIsLoaderShowing }
					/>
				);
			}
			case DefaultSystemNameTab.Network: {
				return (
					<NetworkSettings
						setWarningText={ setWarningText }
						setCustomButtonText={ setCustomButtonText }
						setWarningCallback={ setWarningCallback }
						setIsErrorWarning={ setIsErrorWarning }
						setIsLoaderShowing={ setIsLoaderShowing }
						resetRelaunchWarning={ resetRelaunchWarning }
					/>
				);
			}
			case DefaultSystemNameTab.About: {
				return <About />;
			}
			default: {
				return <GeneralSettings />;
			}
		}
	};

	return (
		<>
			<div className='dialog-settings' onClick={ closeConfirmationWarning }>
				<section className='tabs-section'>
					{ tabs.map((tab) =>
						<SettingsTab
							key={ tab.systemName }
							dataCategory='settings'
							title={ tab.name }
							tabIndex={ currentTab === tab.systemName && tabsFocusable ? 1 : -1 }
							icon={ currentTab === tab.systemName ? tab.iconSelected : tab.icon }
							selected={ currentTab === tab.systemName }
							onClick={ () => handleTabClick(tab.systemName) }
						/>
					) }
				</section>

				<section className='page-section'>
					{ renderTabContent() }
				</section>
			</div>

			{ (warningText || warningCallback) &&
				<SettingsWarning
					warningText={ warningText }
					onClick={ warningCallback }
					customButtonText={ customButtonText }
					isErrorWarning={ isErrorWarning }
					isLoaderShowing={ isLoaderShowing }
				/>
			}
		</>
	);
};
