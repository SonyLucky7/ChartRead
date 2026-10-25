import { WebContents } from 'electron';
import * as Rx from 'rxjs';

import { AppOnboardingLaunchSource } from '../../app/dialog-window/welcome-dialog/constants';
import { SignInSource } from './authentication-handler';
import { ClaimsContainer } from './claims';
import { User } from './user';

export const USER_SERVICE_CONTRACT = 'tvd:user-service';

export interface PrepareSignInOutData {
	user: User;
	workAcceptor(work: Promise<void>): void;
	source?: WebContents;
}

export interface SignInData {
	user: User;
}

export interface IUserService {
	userChange: Rx.Observable<ClaimsContainer>;

	userSignedIn: Rx.Observable<SignInData>;
	userSignedOut: Rx.Observable<void>;
	prepareUserSignIn: Rx.Observable<PrepareSignInOutData>;
	prepareUserSignOut: Rx.Observable<PrepareSignInOutData>;

	getCurrentUser(): User;
	requestProFeature(): Promise<void>;
	doSignIn(source: SignInSource): void;

	showAppOnboardingDialog(source: AppOnboardingLaunchSource, tabId?: string): void;
}
