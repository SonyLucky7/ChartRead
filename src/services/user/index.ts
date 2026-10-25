import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { AUTH_HANDLER_CONTRACT, IAuthenticationHandler } from './iauthentication-handler';
import { IUserService, USER_SERVICE_CONTRACT } from './iuser-service';

export { IUserService, SignInData, USER_SERVICE_CONTRACT } from './iuser-service';
export { User } from './user';
export { ClaimsContainer, CLAIM_LAST_LOCALE } from './claims';
export { AuthenticationResponse, AuthenticationState, AuthenticationStage } from './iauthentication-handler';

export function userService(): IUserService {
	return IpcServices.provide<IUserService>(USER_SERVICE_CONTRACT);
}

export function userServiceProxy(): Promisify<IUserService> {
	return IpcServices.provideProxy<IUserService>(USER_SERVICE_CONTRACT);
}

export function authenticationHandler(): IAuthenticationHandler {
	return IpcServices.provide<IAuthenticationHandler>(AUTH_HANDLER_CONTRACT);
}

export function authenticationHandlerProxy(): Promisify<IAuthenticationHandler> {
	return IpcServices.provideProxy<IAuthenticationHandler>(AUTH_HANDLER_CONTRACT);
}
