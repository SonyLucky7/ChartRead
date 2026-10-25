import React, { useEffect, useState } from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { ILicenses } from '../../services/interfaces';
import { mainServiceProxy } from '../../services/main-service';
import { useI18n } from '../components-ui/hooks';
import { useLocalTabTitleTranslation } from '../components-ui/hooks/use-local-tab-title-translation';
import { Link } from '../components-ui/link';

import './licenses.css';

IpcServices.initializeRpc();

export const Licenses = (): JSX.Element => {
	const { t, i18n } = useI18n(document.documentElement);

	const [licenses, setLicenses] = useState<ILicenses>();

	useLocalTabTitleTranslation(i18n, t('Libraries we use'));

	useEffect(() => {
		const getAndSetLicenses = async(): Promise<void> => {
			try {
				const licensesIn = await mainServiceProxy().getLicenses();

				if (licensesIn === undefined) {
					return;
				}

				setLicenses(licensesIn);
			}
			catch (error) {
				loggerServiceProxy().error('<Licenses>.useEffect(): getAndSetLicenses() error', error);
			}
		};

		getAndSetLicenses();
	}, []);

	return (
		<div className='licenses-container'>
			<Typography tag='span' name='typography-accent-adaptive-m-bold' className='licenses-header'>{ t('Libraries we use') }</Typography>
			<div className="licenses-description">
				<Typography tag='span' name='typography-regular-16px'>
					{ // eslint-disable-next-line max-len
						t('This is our attribution notice on third party software, which may be included in some sections of our Libraries. Also, we have to say a big thanks to everybody in the open source community for all their help, sweat and hard work.')
					}
				</Typography>
			</div>
			<ul className="licenses-content-wrapper">
				{ licenses && Object.entries(licenses).map(([name, license]) =>
					<ToggleItem name={ name } license={ license } key={ name }/>
				) }
			</ul>
		</div>
	);
};

const ToggleItem = ({ name, license }: { name: string; license: string; }): JSX.Element => {
	const [toggled, setToggled] = useState(false);

	const handleClick = (): void => {
		setToggled((prev) => !prev);
	};

	return (
		<li>
			<Link name='link-colors' className="licenses-content-header" onClick={ () => handleClick() } >
				<Typography tag='span' name='typography-regular-16px'>{ name }</Typography>
			</Link>
			{ toggled &&
			<Typography tag='pre' className="licenses-content-text" name='typography-monospaced-12px'>
				{ license }
			</Typography>
			}
		</li>
	);
};
