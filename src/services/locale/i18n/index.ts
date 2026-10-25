import * as path from 'path';
import { app, IpcMainEvent, ipcMain, ipcRenderer } from 'electron';
import i18n, { Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { FileSystemProvider } from '../../../providers/file-system-provider';
import { GET_TRANSLATIONS } from '../../../tv-api/tvd-channels';
import { jsonParse } from '../../../utils/json-parse';

let translations__: Resource;

if (ipcMain) {
	function loadTranslations(): Resource {
		const translations: Resource = {};
		const localesPath = path.join(app.getAppPath(), 'resources', 'locales');

		for (const name of FileSystemProvider.readDirSync(localesPath)) {
			const content = FileSystemProvider.readFileSync(path.join(localesPath, name));
			const lang = path.parse(name).name;
			const translation = jsonParse(content)
			if (translation) {
				translations[lang] = { translation };
			}
		}

		return translations;
	}

	translations__ = loadTranslations();

	ipcMain.on(GET_TRANSLATIONS, (ev: IpcMainEvent) => {
		ev.returnValue = translations__;
	});
}
else {
	translations__ = ipcRenderer.sendSync(GET_TRANSLATIONS);
}

i18n
.use(LanguageDetector)
.use(initReactI18next)
.init({
	keySeparator: '::',
	nsSeparator: ':::',
	resources: translations__,
	fallbackLng: 'en',
	returnEmptyString: false,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
