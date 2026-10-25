import { appSettingsService } from '../app-settings-service';

export function setSymbolSave(shouldSave: boolean): void {
	if (appSettingsService().get('saveSymbolInterval') === shouldSave) {
		return;
	}

	appSettingsService().set('saveSymbolInterval', shouldSave);
}
