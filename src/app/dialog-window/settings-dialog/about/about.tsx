import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerService } from '../../../../logger';
import { autoUpdateServiceProxy } from '../../../../services/update';
import { isMSStore } from '../../../../utils/application-repository-type';
import { isLinux } from '../../../../utils/helpers';
import { getRendererInitialData } from '../../../common/app-common';
import { Link } from '../../../components-ui/link';
import { SettingsWindowData } from '../settings-dialog';
import { UpdateApp } from './update-app';
import { VersionInfoLabelComponent } from './version-info-label';

import './about.css';

const shouldShowUpdateApp = !isLinux() && !isMSStore();

// https://www.unicode.org/charts/nameslist/n_0080.html#00A9
const COPYRIGHT_CHAR = '\u00a9';

export const About = (): JSX.Element => {
	const { t } = useTranslation();

	useEffect(() => {
		autoUpdateServiceProxy().checkForUpdates()
			.catch((error) => {
				loggerService().error('<About>.useEffect(): autoUpdateServiceProxy().checkForUpdates() error', error);
			});
	}, []);

	const { buildInfo } = getRendererInitialData<SettingsWindowData>();

	return (
		<div className='settings-about'>
			<VersionInfoLabelComponent />
			{ shouldShowUpdateApp && <UpdateApp /> }
			<div className='about-link-container'>
				<Link name='link-colors-with-underline' href='tvd://licences' tabIndex={ 1 }>
					<Typography tag='span' name='typography-regular-14px'>
						{ t('Notices & Acknowledgements') }
					</Typography>
				</Link>
				<Link name='link-colors-with-underline' href='https://www.tradingview.com/house-rules/' tabIndex={ 1 }>
					<Typography tag='span' name='typography-regular-14px'>
						{ t('House rules') }
					</Typography>
				</Link>
				<Link
					name='link-colors-with-underline'
					href='https://www.tradingview.com/support/solutions/43000673888-tradingview-desktop-releases-and-release-notes/'
					tabIndex={ 1 }
				>
					<Typography tag='span' name='typography-regular-14px'>
						{ t('Release notes') }
					</Typography>
				</Link>
				<Link
					name='link-colors-with-underline'
					href='https://www.tradingview.com/cookies-policy/'
					tabIndex={ 1 }
				>
					<Typography tag='span' name='typography-regular-14px'>
						{ t('Cookies Policy') }
					</Typography>
				</Link>
			</div>
			<Typography tag='div' name='typography-regular-14px' className='copyright'>
				{ `${ t('Copyright') } ${ COPYRIGHT_CHAR } ${ new Date(buildInfo.buildDate).getFullYear().toString() } ` }
				<span dir='ltr'>TradingView, Inc.</span>
			</Typography>
		</div>
	);
};
