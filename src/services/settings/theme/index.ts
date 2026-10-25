import { BehaviorSubject } from 'rxjs';

import { Promisify } from '../../../ipc-remote';
import { IpcServices } from '../../../ipc-services';
import { Disposable } from '../../../tvd-runtime/core';

export type PlatformTheme = 'dark' | 'light';

export type Theme = 'system' | PlatformTheme;

export interface ThemeOption {
	id: Theme;
	label: string;
}

export type WebcontentsLike = {
	executeJavaScript(code: string): Promise<any>;
	isDestroyed(): boolean;
};

export interface IThemeManager extends Disposable {
	applyTheme(webContents: WebcontentsLike): void;
	setPlatformTheme(): Promise<void>;

	themeChange: BehaviorSubject<Theme>;
	getCurrentTheme(): Theme;
	getPlatformTheme(): PlatformTheme;
	availableThemes(): ThemeOption[];
}

export const THEME_MANAGER_CONTRACT = 'tvd:theme-manager-service';

export function themeManager(): IThemeManager {
	return IpcServices.provide<IThemeManager>(THEME_MANAGER_CONTRACT);
}

export function themeManagerProxy(): Promisify<IThemeManager> {
	return IpcServices.provideProxy<IThemeManager>(THEME_MANAGER_CONTRACT);
}
