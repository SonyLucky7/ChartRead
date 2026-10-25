import React, { useRef, useState } from 'react';

import { loggerServiceProxy } from '../../../logger';
import { User, userServiceProxy } from '../../../services/user';
import { isDarwin } from '../../../utils';
import { getDialogControl } from '../../common/app-common';
import { useObservable, useOutsideClick } from '../../components-ui/hooks';
import { APP_ONBOARDING_LOCAL_STORAGE_LAUNCH_SOURCE_FIELD, AppOnboardingLaunchSource } from './constants';
import { OnboardingDialog } from './onboarding-dialog/onboarding-dialog';
import { SignInDialog } from './signin-dialog/signin-dialog';

import './welcome-dialog.css';

export function getAppOnboardingLaunchSource(): string | undefined {
	return localStorage.getItem(APP_ONBOARDING_LOCAL_STORAGE_LAUNCH_SOURCE_FIELD) ?? undefined;
}

export const WelcomeDialog = (): JSX.Element => {
	const ref = useRef<HTMLDivElement>(null);

	const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);

	useObservable(userServiceProxy().userChange, (claims) => {
		setIsAnonymous(new User(claims).isAnonymous);
	});

	useOutsideClick<HTMLDivElement>(
		ref,
		true,
		() => {
			if (isDarwin() || getAppOnboardingLaunchSource() !== AppOnboardingLaunchSource.LaunchedByUser) {
				return;
			}

			getDialogControl().closeDialogWindow()
				.catch((error) => {
					loggerServiceProxy().error('<WelcomeDialogWrapper>.useOutsideClick(): getDialogControl().closeDialogWindow() error', error);
				});
		},
		{
			escape: true,
		}
	);

	return (
		<div className={ `welcome-dialog-container ${ isDarwin() ? 'darwin' : '' }` }>
			<div ref={ ref } className={ `dialog welcome ${ isDarwin() ? 'darwin' : '' }` }>
				{ isAnonymous
					? <SignInDialog />
					: <OnboardingDialog />
				}
			</div>
		</div>
	);
};
