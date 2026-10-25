import '../../../tv-api/window';
import { ipcMain, nativeTheme, session } from 'electron';
import i18next from 'i18next';
import { BehaviorSubject, Subscription } from 'rxjs';

import { ExposeSingletonService, IpcServices } from '../../../ipc-services';
import { loggerService } from '../../../logger';
import { logCall } from '../../../logger/log-decorator';
import { GET_THEME, GET_THEME_SETTING, SET_THEME_SETTING, THEME_UPDATE } from '../../../tv-api/tvd-channels';
import { ignorePromise } from '../../../utils/async';
import { appSettingsService } from '../../app-settings-service';
import { getConfiguration } from '../../configuration';
import { windowService } from '../../window';
import { IThemeManager, PlatformTheme, Theme, THEME_MANAGER_CONTRACT, ThemeOption } from '.';

function themeHelper(theme: PlatformTheme): void {
	if (!window.TradingViewApi?.themes) {
		if (window._setTheme) {
			window._setTheme(theme);
		}
		return;
	}

	const themes = window.TradingViewApi?.themes();
	if (!themes) {
		return;
	}

	themes.setStdThemeForLayout(theme, false);

	themes.isStdTheme()
		.then((isStandard) => {
			if (isStandard) {
				void themes.setStdTheme(theme, false);
			}
		})
		.catch(() => console.log('Failed to set chart theme'));
}

@ExposeSingletonService(THEME_MANAGER_CONTRACT, IpcServices.getProvider())
export class ThemeManager implements IThemeManager {
	readonly themeChange: BehaviorSubject<Theme>;
	themeChangeSubscription: Subscription;

	private readonly themeCookieName = 'theme';

	private nativeDarkColors?: boolean;

	constructor() {
		loggerService().debug('Initializing ThemeManager service');

		this.themeChange = new BehaviorSubject(appSettingsService().get('theme'));
		this.themeChangeSubscription = this.themeChange.subscribe(value => {
			nativeTheme.themeSource = value;
			appSettingsService().set('theme', value);

			ignorePromise(this.setPlatformTheme());
			windowService().broadcastChannel(THEME_UPDATE, this.getPlatformTheme());
			windowService().tokyoNightSubject.next(false);
		});

		nativeTheme.on('updated', () => {
			if (!this.isSystemTheme()) {
				return;
			}

			if (this.nativeDarkColors === nativeTheme.shouldUseDarkColors) {
				return;
			}

			this.nativeDarkColors = nativeTheme.shouldUseDarkColors;
			this.themeChange.next('system');
		});

		ipcMain.handle(GET_THEME, () => {
			loggerService().debug('Platform requested get-theme');
			return this.getPlatformTheme();
		});

		ipcMain.handle(GET_THEME_SETTING, () => {
			loggerService().debug('Platform requested tvd:get-theme-setting');
			return this.themeChange.value;
		});

		ipcMain.on(SET_THEME_SETTING, (ev, theme: Theme): void => {
			loggerService().debug('Platform requested tvd:set-theme-setting');
			this.themeChange.next(theme);
		});
	}

	getCurrentTheme(): Theme {
		return this.currentTheme();
	}

	getPlatformTheme(): PlatformTheme {
		const theme = appSettingsService().get('theme');

		if (theme !== 'system') {
			return theme;
		}

		return this.getSystemTheme();
	}

	@logCall
	availableThemes(): ThemeOption[] {
		const themeOptions: ThemeOption[] = [
			{ id: 'system', label: i18next.t('System') },
			{ id: 'dark', label: i18next.t('Dark') },
			{ id: 'light', label: i18next.t('Light') },
		];

		return themeOptions;
	}

	@logCall
	applyTheme(webContents: Electron.WebContents): void {
		if (webContents.isDestroyed()) {
			loggerService().error('[ThemeManager.applyTheme()] Webcontents destroyed');
			return;
		}

		const theme = this.getPlatformTheme();

		ignorePromise(
			webContents.executeJavaScript(`(${ themeHelper.toString() })('${ theme }')`));
	}

	@logCall
	async setPlatformTheme(): Promise<void> {
		const host = getConfiguration().urls.defaultHost;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const themeCookieDomain = `.${ host.split('.').slice(-2).join('.').replace(/\/$/, '') }`;
		try {
			await session.defaultSession.cookies.set({
				url: host,
				domain: themeCookieDomain,
				name: this.themeCookieName,
				value: this.getPlatformTheme(),
			});
		}
		catch (err) {
			loggerService().error('[ThemeManager.initPlatformTheme()] Failed to set theme cookie', err);
		}
	}

	private currentTheme(): Theme {
		return appSettingsService().get('theme');
	}

	private getSystemTheme(): PlatformTheme {
		return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
	}

	private isSystemTheme(): boolean {
		return appSettingsService().get('theme') === 'system';
	}

	dispose(): void {
		this.themeChangeSubscription.unsubscribe();
	}
}
