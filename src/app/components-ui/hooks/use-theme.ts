import { useState } from 'react';

import { PlatformTheme, Theme, themeManagerProxy } from '../../../services/settings/theme';
import { useObservable } from './use-observable';

export const getThemeDOM = (): PlatformTheme => document.documentElement.getAttribute('data-theme') as PlatformTheme ?? 'light';

interface UseThemeHook {
	theme: Theme;
	platformTheme: PlatformTheme;
	isDarkTheme: boolean;
}

export function useTheme(): UseThemeHook {
	const [theme, setTheme] = useState<Theme>(getThemeDOM());
	const [platformTheme, setPlatformTheme] = useState<PlatformTheme>(getThemeDOM());

	const themeHandler = (themeValue: Theme): void => {
		const themeHandlerTimeout = 30;

		setTimeout(() => {
			setTheme(themeValue);
			setPlatformTheme(themeValue === 'system' ? getThemeDOM() : themeValue);
		}, themeHandlerTimeout);
	};

	useObservable<Theme>(themeManagerProxy().themeChange, themeHandler);

	return { theme, platformTheme, isDarkTheme: platformTheme === 'dark' };
}
