import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../components-ui/hooks';
import { Icon } from '../../../components-ui/icon';
import { ThemePicker } from '../../../components-ui/theme-picker';
import { ThemeOptionSize } from '../../../components-ui/theme-picker/theme-option';
import { NavigationPanel } from './navigation-panel';
import { OnboardingContent } from './onboarding-content';
import { OnboardingProgressBar } from './onboarding-progress-bar';

import crosshairSyncingDark from './assets/crosshair-syncing-dark.webm';
import crosshairSyncingLight from './assets/crosshair-syncing-light.webm';
import tabLinkingVideoDark from './assets/tab-linking-dark.webm';
import tabLinkingVideoLight from './assets/tab-linking-light.webm';

export interface OnboardingStagesData {
	stagesAmount: number;
	currentStageIndex: number;
}

export const enum OnboardingStage {
	Themes,
	MultiMonitorSupport,
	CrosshairSync,
	TabsLinking,
}

export const enum OnboardingContentType {
	Video = 'video',
	Custom = 'custom',
}

interface OnboardingContentVideo {
	type: OnboardingContentType.Video;
	video: {
		source: string;
		autoplay: boolean;
	};
}

interface OnboardingContentCustom {
	type: OnboardingContentType.Custom;
	element: JSX.Element;
}

export interface OnboardingStageData {
	title: string;
	subtitle: React.ReactNode;
	content: OnboardingContentVideo | OnboardingContentCustom;
}

// TODO: use ui-lib monochrome icon in after DRG-2120 is merged (ui-lib is updated) or in TVD-2000
// eslint-disable-next-line max-len
const doubleMonitorSvgIcon = '<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M16 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.75v1.5H13V16H5v-1.5h3.25V13H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h14ZM2.5 4.5V10h5.75V4.5H2.5Zm7.25 0V10h5.75V4.5H9.75Z" fill="currentColor"/></svg>';

const MultiMonitorSubtitle = ({ t }: { t: TFunction; }): JSX.Element =>
	<>
		{ t('TradingView Desktop allows you to set up and restore your multi-monitor workspace. Create a new window with') }
		{ ' ' }
		<span className='onboarding-multi-monitor-icon-wrapper'><Icon icon={ doubleMonitorSvgIcon } className='onboarding-multi-monitor-icon' /></span>
		{ ' ' }
		{ t('or just detach the tab.') }
	</>;

function getStageData(t: TFunction, isDarkTheme: boolean, stage: OnboardingStage): OnboardingStageData | null {
	const onboardingStageDataMap = new Map<OnboardingStage, OnboardingStageData>([
		[
			OnboardingStage.Themes,
			{
				title: t('Let\'s start with the theme'),
				subtitle: t('In the first instance, the Desktop app matches its appearance to your system\'s existing theme, but you\'re welcome to change it here.'),
				content: {
					type: OnboardingContentType.Custom,
					element: <ThemePicker size={ ThemeOptionSize.Large } tabIndex={ -1 } />,
				},
			},
		],
		[
			OnboardingStage.MultiMonitorSupport,
			{
				title: t('Native multi-monitor support'),
				subtitle: <MultiMonitorSubtitle t={ t } />,
				content: {
					type: OnboardingContentType.Video,
					video: {
						source: isDarkTheme ? crosshairSyncingDark : crosshairSyncingLight,
						autoplay: false,
					},
				},
			},
		],
		[
			OnboardingStage.CrosshairSync,
			{
				title: t('Crosshair sync'),
				subtitle: t('Ideal for a thorough study of the market, your crosshairs will move in sync across all your displays to help you streamline your trading workflow.'),
				content: {
					type: OnboardingContentType.Video,
					video: {
						source: isDarkTheme ? crosshairSyncingDark : crosshairSyncingLight,
						autoplay: true,
					},
				},
			},
		],
		[
			OnboardingStage.TabsLinking,
			{
				title: t('Tabs linking by symbol'),
				subtitle: t('When you set the same color for different tabs, any changes to the symbol will automatically load on all tabs of that same color.'),
				content: {
					type: OnboardingContentType.Video,
					video: {
						source: isDarkTheme ? tabLinkingVideoDark : tabLinkingVideoLight,
						autoplay: true,
					},
				},
			},
		],
	]);

	return onboardingStageDataMap.get(stage) ?? null;
}

const stages = [
	OnboardingStage.Themes,
	OnboardingStage.MultiMonitorSupport,
	OnboardingStage.CrosshairSync,
	OnboardingStage.TabsLinking,
];

export const OnboardingDialog = (): JSX.Element => {
	const { t } = useTranslation();

	const { isDarkTheme } = useTheme();

	const [currentStage, setCurrentStage] = useState(0);

	const stageData = getStageData(t, isDarkTheme, currentStage);

	if (stageData === null) {
		return <></>;
	}

	const { title, subtitle, content } = stageData;

	return (
		<div className='onboarding'>
			<OnboardingProgressBar
				stagesAmount={ stages.length }
				currentStageIndex={ currentStage }
			/>
			<OnboardingContent
				title={ title }
				subtitle={ subtitle }
				content={ content }
			/>
			<NavigationPanel
				stagesAmount={ stages.length }
				currentStageIndex={ currentStage }
				setCurrentStageIndex={ setCurrentStage }
			/>
		</div>
	);
};
