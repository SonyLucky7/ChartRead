import { Observable } from 'rxjs';

export const AUTH_HANDLER_CONTRACT = 'tvd:auth-handler';

export interface IAuthenticationHandler {
	authenticationState: Observable<AuthenticationState>;
	acceptRedirectUrl(url: string): void;
	signInWithBrowser(): Promise<void>;
	cancelSignIn(): void;
}

export interface AuthenticationState {
	stage: AuthenticationStage;
	error?: string;
}

export interface AuthenticationResponse {
	error?: string;
	code?: string;
	message?: string;
	// eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
	two_factor_types?: { name: string; }[];
}

export enum AuthenticationStage {
	NoAuthentication,
	WaitingToken,
	TokenReady,
	Waiting2FA,
	Authenticated,
	Error,
}

export const WAIT_REDIRECT_TIMEOUT_EXPIRED = 'Authentication token wait timeout';
