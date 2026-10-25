import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../logger';
import { authenticationHandlerProxy, AuthenticationStage } from '../../../../services/user';
import { KeyboardEventKey } from '../../../../utils';
import { getDialogControl } from '../../../common/app-common';

import TVLogoFull from './assets/tv-logo-full.svg';
import TVLogoShort from './assets/tv-logo-short.svg';

import './sign-in-content.css';

interface SignInContentProps {
	stage: AuthenticationStage;
}

const enum SignInLogoType {
	Short = 'short',
	Full = 'full',
}

const SignInLogo = ({ type }: { type: SignInLogoType; }): JSX.Element =>
	<div className={ `sign-in-logo ${ type }` }>
		{ type === SignInLogoType.Full ? <TVLogoFull /> : <TVLogoShort /> }
	</div>;

export const SignInContent = ({ stage }: SignInContentProps): JSX.Element => {
	const { t } = useTranslation();

	const onSignInClick = (): void => {
		authenticationHandlerProxy().signInWithBrowser()
			.catch((error) => {
				loggerServiceProxy().error('<SignInContent>.onSignInClick(): authenticationHandlerProxy().signInWithBrowser() error', error);
			});
	};

	useEffect(() => {
		const keyDownHandler = (ev: KeyboardEvent): void => {
			if (stage !== AuthenticationStage.NoAuthentication) {
				return;
			}

			if (ev.key === KeyboardEventKey.Enter || ev.key === KeyboardEventKey.Space) {
				onSignInClick();
			}

			if (ev.key === KeyboardEventKey.Escape) {
				getDialogControl().closeDialogWindow()
					.catch((error) => {
						loggerServiceProxy().error('<SignInContent>.useEffect(): getDialogControl().closeDialogWindow() error', error);
					});
			}
		};

		window.addEventListener('keydown', keyDownHandler);

		return () => {
			window.removeEventListener('keydown', keyDownHandler);
		};
	}, [stage]);

	switch (stage) {
		case AuthenticationStage.NoAuthentication:
		case AuthenticationStage.Error: {
			return (
				<div className='sign-in-content default'>
					<SignInLogo type={ SignInLogoType.Short } />
					<Typography tag='h1' name='typography-accent-24px-bold' className='sign-in-title'>
						{ t('Welcome to TradingView') }
					</Typography>
					<SquareButton
						onClick={ onSignInClick }
						size={ ButtonSize.XLarge }
						variant={ ButtonVariant.Primary }
						stretch
					>
						{ t('Sign in with browser') }
					</SquareButton>
				</div>
			);
		}
		case AuthenticationStage.TokenReady:
		case AuthenticationStage.WaitingToken: {
			return (
				<div className='sign-in-content grant-access'>
					<SignInLogo type={ SignInLogoType.Full } />

					<Typography tag='h1' name='typography-accent-28px-bold' className='grant-access-header'>
						{ t('Grant access') }
					</Typography>
					<div className='grant-access-text'>
						<Typography name='typography-regular-16px' tag='p'>
							{ t('In your browser, grant this application access to your TradingView account and come back.') }
						</Typography>
						<Typography name='typography-regular-16px' tag='p'>
							{ t('Already granted access but still seeing this? Copy the secret key from the authentication page in your browser and then return here.') }
						</Typography>
					</div>
				</div>
			);
		}
		default: {
			return (
				<div className='sign-in-content'>
					<SignInLogo type={ SignInLogoType.Full } />
				</div>
			);
		}
	}
};
