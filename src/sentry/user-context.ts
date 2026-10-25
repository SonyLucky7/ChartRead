import { setContext, setUser } from '@sentry/electron/renderer';

import { IUserService, SignInData } from '../services/user';

export enum UserType {
	Anonymous,
	NonPro,
	Pro,
}

export const allowedUsers: UserType[] = [UserType.Pro];

export function subscribeSentryToUserService(userService: IUserService): void {
	updateCurrentUser({ user: userService.getCurrentUser() });

	userService.userSignedIn.subscribe(userData => {
		onUserSignedIn(userData);
	});

	userService.userSignedOut.subscribe(() => {
		onUserSignedOut();
	});
}

function onUserSignedIn(userData: SignInData): void {
	updateCurrentUser(userData);
}

function onUserSignedOut(): void {
	updateCurrentUser();
}

function updateCurrentUser(userData?: SignInData): void {
	if (!userData || userData.user.isAnonymous) {
		setUser(null);
		setContext('user', { userType: UserType.Anonymous });
		return;
	}

	setUser({
		id: userData.user.id,
		username: userData.user.username,
	});

	setContext('user', { userType: userData.user.isPro ? UserType.Pro : UserType.NonPro });
}
