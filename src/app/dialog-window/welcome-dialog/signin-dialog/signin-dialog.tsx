import React, { useState } from 'react';
import { CloseButton } from '@tradingview/ui-lib/buttons/close-button';
import { ButtonSize } from '@tradingview/ui-lib/buttons/square-button';

import { loggerServiceProxy } from '../../../../logger';
import { authenticationHandlerProxy } from '../../../../services/user';
import { AuthenticationStage, AuthenticationState } from '../../../../services/user/iauthentication-handler';
import { getDialogControl } from '../../../common/app-common';
import { useObservable } from '../../../components-ui/hooks';
import { SignInContent } from './sign-in-content';
import { SignInFooter } from './sign-in-footer';

import './signin-dialog.css';

export const SignInDialog = (): JSX.Element => {
	const [stage, setStage] = useState<AuthenticationStage>(AuthenticationStage.NoAuthentication);
	const [error, setError] = useState<string>('');

	useObservable<AuthenticationState>(authenticationHandlerProxy().authenticationState, (state) => {
		if (stage === AuthenticationStage.Waiting2FA && state.stage !== AuthenticationStage.NoAuthentication) {
			return;
		}

		setStage(state.stage);

		if (state.error) {
			setError(state.error);
		}
		else {
			setError('');
		}
	}, [stage]);

	const close = (): void => {
		getDialogControl().closeDialogWindow()
			.catch((err) => {
				loggerServiceProxy().error('<SignInDialog>.close(): getDialogControl().closeDialogWindow() error', err);
			});
	};

	return (
		<div className="sign-in">
			<SignInContent stage={ stage } />
			<SignInFooter stage={ stage } error={ error } />

			<div className='sign-in-button-close'>
				<CloseButton
					aria-label='sign-in-button-close'
					size={ ButtonSize.Medium }
					onClick={ close }
				/>
			</div>
		</div>
	);
};
