import { RenderProcessGoneDetails } from 'electron/renderer';
import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { ApplyLinks, ApplyLinksVariant } from '@tradingview/ui-lib/apply-links';
import { ButtonSize, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { networkServiceProxy } from '../../main/network';
import { errorViewServiceProxy } from '../../services/error-view-service';
import { TabError } from '../../services/window/tab/tab-error-state';
import { getRendererInitialData } from '../common/app-common';
import { useI18n, useObservable, useTVHost } from '../components-ui/hooks';
import { useLocalTabTitleTranslation } from '../components-ui/hooks/use-local-tab-title-translation';
import { Spinner } from '../spinner';

import ErrorLoadSvg from './assets/error-load-icon.svg';
import ErrorPageNotFound from './assets/error-page-not-found.svg';
import ErrorTabSvg from './assets/error-tab-icon.svg';

import './error-view.css';

IpcServices.initializeRpc();

const decodedReason = new Map<RenderProcessGoneDetails['reason'] | undefined, string>([
	['clean-exit', 'process exited with an exit code of zero'],
	['abnormal-exit', 'process exited with a non-zero exit code'],
	['killed', 'process was sent a SIGTERM or otherwise killed externally'],
	['crashed', 'process crashed'],
	['oom', 'process ran out of memory'],
	['launch-failed', 'process never successfully launched'],
	['integrity-failure', 'Windows code integrity checks failed'],
	[undefined, ''],
]);

function getTabErrorInfo(tabError: TabError, t: TFunction): {
	title: string;
	details: string;
	description: string;
	buttonTitle: string;
	icon: JSX.Element;
} {
	const defaultDetails = 'unknown';

	switch (tabError.type) {
		case 'crash':
			return {
				title: t('This tab crashed due to an error'),
				details: decodedReason.get(tabError.crashReason) ?? defaultDetails,
				description: t('You can reload the tab and pick up where you left off. If the tab crashes too often, check out {startLink}this troubleshooting guide{endLink}.'),
				buttonTitle: t('Reload'),
				icon: <ErrorTabSvg/>,
			};
		case 'load-failed':
			return {
				title: t('Something went wrong'),
				details: '',
				description: t('Page could not be loaded. Please check your internet connection and try again.'),
				buttonTitle: t('Try again'),
				icon: <ErrorLoadSvg/>,
			};
		case 'page-not-found':
			return {
				title: t('This link isn\'t active anymore'),
				details: '',
				description: t('The content you\'re looking for might have been removed or it\'s no longer available. Please close this tab or explore other features.'),
				buttonTitle: t('Explore features'),
				icon: <ErrorPageNotFound/>,
			};
		default:
			return {
				title: 'unknown',
				details: defaultDetails,
				description: 'unknown',
				buttonTitle: '',
				icon: <></>,
			};
	}
}

export const ErrorView = (): JSX.Element => {
	const { t, i18n } = useI18n(document.documentElement);

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isProxyFeatureEnabled, setIsProxyFeatureEnabled] = useState<boolean>(false);

	useLocalTabTitleTranslation(i18n, t('Oops, something went wrong'));

	useObservable<boolean>(networkServiceProxy().proxyEnabledChange, setIsProxyFeatureEnabled);

	const tabError = getRendererInitialData<TabError>();

	const tryReloadHandler = (): void => {
		if (isProxyFeatureEnabled) {
			networkServiceProxy().turnOffProxy().catch((error) => {
				loggerServiceProxy().error('<ErrorView>.tryReloadHandler(): networkServiceProxy().turnOffProxy() error', error);
			});
			return;
		}

		setIsLoading(true);

		errorViewServiceProxy().tryToRestoreFailedTabs()
			.catch((error) => {
				loggerServiceProxy().error('<ErrorView>.tryReloadHandler(): errorViewServiceProxy().tryToRestoreFailedTabs() error', error);
			});

		setTimeout(() => setIsLoading(false), 100);
	};

	const exploreFeatures = (): void => {
		document.location.assign('tvd://new-tab');
	};

	const errorInfo = getTabErrorInfo(tabError, t);

	const { tvHost } = useTVHost();

	if (isProxyFeatureEnabled && tabError.type !== 'page-not-found') {
		errorInfo.buttonTitle = t('Relaunch app');
		errorInfo.description = t('Proxy mode is currently turned on. Try to turn off proxy mode.');
	}

	if (isLoading) {
		return <Spinner />;
	}

	const {
		title,
		details,
		description,
		buttonTitle,
		icon,
	} = errorInfo;

	return (
		<div className="error-body">
			<div className="error-content">
				<div className="error-icon">
					{ icon }
				</div>
				<div className="error-description">
					<div className="error-title">
						<Typography name='typography-accent-24px-bold' tag='span'>{ title }</Typography>
					</div>
					<div className="error-text">
						<Typography name='typography-regular-16px' tag='span'>
							<ApplyLinks
								links={ [{
									linkStart: 'startLink',
									linkEnd: 'endLink',
									href: `${ tvHost }support/solutions/43000760580-what-to-do-if-a-tab-crashes/`,
									variant: ApplyLinksVariant.Primary,
								}] }>
								{ description }
							</ApplyLinks>
						</Typography>
						{ details &&
							<div className="error-details">
								<Typography name='typography-regular-16px' tag='span'>
									{ t('Error details: ') + details }
								</Typography>
							</div>
						}
					</div>
				</div>
				{ buttonTitle &&
					<SquareButton
						onClick={ tabError.type === 'page-not-found' ? exploreFeatures : tryReloadHandler }
						size={ ButtonSize.Large }
					>
						<Typography name='typography-accent-16px-medium' tag='span'>{ buttonTitle }</Typography>
					</SquareButton>
				}
			</div>
		</div>
	);
};
