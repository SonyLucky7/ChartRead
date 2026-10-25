import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { app } from '@electron/remote';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { svgIconcheckSize28pxFilledOnTypeCircle as checkSvgIcon } from '@tradingview/ui-lib/icons/monochrome/check/size_28px__filled_on__type_circle';
import { svgIconstatusSize28pxFilledOnTypeExclamation as exclamationSvgIcon } from '@tradingview/ui-lib/icons/monochrome/status/size_28px__filled_on__type_exclamation';
import { CircleProgressbar, CircleProgressbarIntent, CircleProgressbarSize } from '@tradingview/ui-lib/progressbar/circle-progressbar';
import { Typography } from '@tradingview/ui-lib/typography';

import { autoUpdateServiceProxy, UpdateStatus } from '../../../../../services/update';
import { useObservable } from '../../../../components-ui/hooks';
import { Icon } from '../../../../components-ui/icon';
import { Link } from '../../../../components-ui/link';
import { DownloadIcon } from './download-icon';

import './update-app.css';

interface StatusInfo {
	title: string;
	icon: JSX.Element;
}

const getStatusInfo = (t: TFunction, status: UpdateStatus): StatusInfo => {
	const defaultStatusInfo: StatusInfo = {
		title: t('TradingView is up to date'),
		icon: <Icon icon={ checkSvgIcon } className='update-app-status-icon-success' />,
	};

	const statusInfo = new Map<UpdateStatus, StatusInfo>([
		[UpdateStatus.Checking, {
			title: t('Checking for updates'),
			icon:
				<CircleProgressbar
					intent={ CircleProgressbarIntent.neutral }
					size={ CircleProgressbarSize.Small }
				/>,
		}],
		[UpdateStatus.UpToDate, defaultStatusInfo],
		[UpdateStatus.Downloading, {
			title: t('New version is downloading'),
			icon: <DownloadIcon size={ 28 } />,
		}],
		[UpdateStatus.ReadyToInstall, {
			title: t('Relaunch to update the app'),
			icon: <Icon icon={ checkSvgIcon } className='update-app-status-icon-success' />,
		}],
		[UpdateStatus.SystemRequirementsUnmet, {
			title: t('App can\'t be updated due to an unsupported version of your operating system.'),
			icon: <Icon icon={ exclamationSvgIcon } className='update-app-status-icon-warning' />,
		}],
		[UpdateStatus.Installing, {
			title: t('Relaunching the app to install new version'),
			icon: <Icon icon={ checkSvgIcon } className='update-app-status-icon-success' />,
		}],
		[UpdateStatus.Error, defaultStatusInfo],
	]);

	return statusInfo.get(status) ?? defaultStatusInfo;
};

const updateAndReload = (): void => {
	app.relaunch();
	app.quit();
};

export const UpdateApp = (): JSX.Element => {
	const { t } = useTranslation();

	const [status, setStatus] = useState<UpdateStatus>(UpdateStatus.UpToDate);
	useObservable<UpdateStatus>(autoUpdateServiceProxy().statusChange, setStatus);

	const statusInfo = getStatusInfo(t, status);

	return (
		<div className={ `update-app ${ status }` }>
			<div className='update-app-text-container'>
				<div className='update-app-status-icon'> { statusInfo.icon } </div>
				<Typography tag='span' name='typography-regular-14px' className='update-app-status-text'>
					{ statusInfo.title }
					{ status === UpdateStatus.SystemRequirementsUnmet &&
						<>
							{ ' ' }
							<Link
								name='link-colors-with-underline'
								href='https://www.tradingview.com/?solution=43000706464'
								tabIndex={ 1 }
							>
								{ t('Learn more') }
							</Link>
						</>
					}
				</Typography>
			</div>
			{ status === UpdateStatus.Installing &&
				<CircleProgressbar
					intent={ CircleProgressbarIntent.neutral }
					size={ CircleProgressbarSize.Small }
				/>
			}
			{ status === UpdateStatus.ReadyToInstall &&
				<SquareButton
					onClick={ updateAndReload }
					variant={ ButtonVariant.Secondary }
					color={ ButtonColor.Black }
					size={ ButtonSize.XSmall }
					id='updateButton'
					tabIndex={ 1 }
				>
					{ t('Relaunch') }
				</SquareButton>
			}
		</div>
	);
};
