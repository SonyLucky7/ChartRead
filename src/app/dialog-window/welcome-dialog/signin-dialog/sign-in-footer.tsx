import React from 'react';
import { useTranslation } from 'react-i18next';
import { Divider, DividerOrientation, DividerSize, DividerType } from '@tradingview/ui-lib/divider';
import { Informer, InformerIntent } from '@tradingview/ui-lib/informer';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../logger';
import { authenticationHandlerProxy, AuthenticationStage } from '../../../../services/user';
import { Link } from '../../../components-ui/link/link';
import { BREAKING_SPACE_CHAR } from '../../helpers';

import './sign-in-footer.css';

interface SignInFooterProps {
	stage: AuthenticationStage;
	error?: string;
}

export const SignInFooter = ({ stage, error }: SignInFooterProps): JSX.Element => {
	const { t } = useTranslation();

	const onSignUpClick = (): void => {
		authenticationHandlerProxy().signInWithBrowser()
			.catch((err) => {
				loggerServiceProxy().error('<SignInFooter>.onSignUpClick(): authenticationHandlerProxy().signInWithBrowser() error', err);
			});
	};

	const onStepBackClick = (): void => {
		authenticationHandlerProxy().cancelSignIn()
			.catch((err) => {
				loggerServiceProxy().error('<SignInFooter>.onStepBackClick(): authenticationHandlerProxy().cancelSignIn() error', err);
			});
	};

	return (
		<footer className='sign-in-footer'>
			{ error !== '' &&
				<Informer
					informerIntent={ InformerIntent.Warning }
					content={ error }
					className='sign-in-error'
					isIconShown
				/>
			}
			<Divider
				type={ DividerType.Primary }
				size={ DividerSize.XSmall }
				orientation={ DividerOrientation.Horizontal }
			/>
			<Typography name='typography-regular-16px' tag='p' className='sign-in-footer-content'>
				{ stage === AuthenticationStage.Waiting2FA
					? <>
						{ t('If something went wrong,') }
						{ BREAKING_SPACE_CHAR }
						<Link name="link-colors-with-underline" onClick={ onStepBackClick } >{ t('step back') }</Link>
						{ BREAKING_SPACE_CHAR }
						{ t('and retry') }
					</>
					: <>
						{ t('Don\'t have an account?') }
						{ BREAKING_SPACE_CHAR }
						<Link name='link-colors-with-underline' onClick={ onSignUpClick }>{ t('Sign up') }</Link>
					</>
				}
			</Typography>
		</footer>
	);
};
