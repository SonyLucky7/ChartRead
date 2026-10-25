import { Promisify } from '../../ipc-remote';
import { IpcServices } from '../../ipc-services';
import { ISettingsProvider, SETTINGS_PROVIDER_CONTRACT } from './isettings-provider';

export { SettingsWindowOptions } from './settings-tabs';
export { ConfirmationCallback, ISettingsProvider } from './isettings-provider';

export function settingsProvider(): ISettingsProvider {
	return IpcServices.provide<ISettingsProvider>(SETTINGS_PROVIDER_CONTRACT);
}

export function settingsProviderProxy(): Promisify<ISettingsProvider> {
	return IpcServices.provideProxy<ISettingsProvider>(SETTINGS_PROVIDER_CONTRACT);
}
