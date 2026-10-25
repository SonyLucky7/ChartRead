import React, { useState } from 'react';

import { loggerServiceProxy } from '../../logger';
import { localeServiceProxy } from '../../services/locale';
import { Theme, themeManagerProxy, ThemeOption as ThemeOptionType } from '../../services/settings/theme';
import { useObservable } from './hooks/use-observable';
import { ThemeOption, ThemeOptionSize } from './theme-picker/theme-option';

import './theme-picker/theme-picker.css';

interface ThemePickerProps {
	afterThemeIsChangedCb?(): void | Promise<void>;
	size?: ThemeOptionSize;
	tabIndex?: number;
}

export const ThemePicker = ({ afterThemeIsChangedCb, size = ThemeOptionSize.Medium, tabIndex }: ThemePickerProps): JSX.Element => {
	const [availableThemes, setAvailableThemes] = useState<ThemeOptionType[]>([]);
	const [currentTheme, setCurrentTheme] = useState<Theme>('system');

	useObservable<Theme>(themeManagerProxy().themeChange, setCurrentTheme);

	const localeChangeHandler = (): void => {
		const getAvailableThemes = async(): Promise<void> => {
			const themes = await themeManagerProxy().availableThemes();
			setAvailableThemes(themes);
		};

		getAvailableThemes()
			.catch((error) => {
				loggerServiceProxy().error('<ThemePicker>.localeChangeHandler(): getAvailableThemes() error', error);
			});
	};

	useObservable(localeServiceProxy().localeChange, localeChangeHandler);

	const onThemeClick = (theme: Theme): void => {
		if (currentTheme === theme) {
			return;
		}

		themeManagerProxy().themeChange.next(theme);

		afterThemeIsChangedCb?.()
			?.catch((error) => {
				loggerServiceProxy().error('<ThemePicker>.onThemeClick(): afterThemeIsChangedCb() error', error);
			});
	};

	return (
		<div className={ `theme-picker ${ size }` }>
			{ availableThemes.map((theme) =>
				<ThemeOption
					key={ theme.id }
					onClick={ onThemeClick }
					theme={ theme }
					isActive={ currentTheme === theme.id }
					showLabel
					size={ size }
					tabIndex={ tabIndex }
				/>
			) }
		</div>
	);
};
