import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';
import { Typography } from '@tradingview/ui-lib/typography';

import { CredentialsDialogData, DialogProps } from '../../services/window/window-api';
import { TextInput } from '../components-ui/text-input';

import './credential-dialog.css';

interface CredentialDialogProps extends DialogProps<CredentialsDialogData> {}

export default ({ data, inputChange }: CredentialDialogProps): JSX.Element => {
	const { t } = useTranslation();

	const { enteredCredentials: { account, password }, isUpdateSavedPassword } = data;

	useEffect(() => {
		inputChange({
			credentials: {
				account,
				password,
			},
		});
	}, [account, inputChange, password]);

	return (
		<div className='broker-credentials'>
			{ isUpdateSavedPassword &&
				<Typography
					tag='p'
					name='typography-accent-20px-semibold'
					className='broker-credentials-subtitle'
				>
					{ account }
				</Typography>
			}
			<div className='broker-credentials-inputs'>
				{ !isUpdateSavedPassword &&
					<TextInput
						value={ account }
						onChange={ () => {} }
						className='broker-credentials-input'
						label={ t('Username') }
						disabled
						size={ ControlSize.Medium }
					/>
				}
				<TextInput
					value={ password }
					onChange={ () => {} }
					className='broker-credentials-input'
					allowShowPasswordWhenDisabled
					label={ t('Password') }
					disabled
					size={ ControlSize.Medium }
					type='password'
				/>
			</div>
		</div>
	);
};
