export const PASSWORD_MANAGER_SERVICE_CONTRACT = 'tvd:password-manager-service';

export interface Credentials {
	account: string;
	password: string;
}

export interface CredentialsToInput extends Credentials {
	accountLength?: number;
	passwordLength?: number;
}
export interface ElementAttributes {
	id: string;
	name: string;
}

export interface DomRect {
	x: number;
	y: number;
	height: number;
	width?: number;
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

export interface IPasswordManagerServiceIpc {
	setPassword(account: string, password: string, service?: string): void;
	getPassword(service?: string): Promise<string | null>;
	deletePassword(account: string, service?: string): void;
	getCredentialsByService(service?: string): Promise<Credentials[] | undefined>;
	deleteCredentials(service?: string): Promise<void>;

}
export interface IPasswordManagerService extends IPasswordManagerServiceIpc {
	setShouldSaveCredentials(answer: boolean): void;
	getShouldSaveCredentials(): boolean;
	canUseStorageByService(service?: string): boolean;
}
