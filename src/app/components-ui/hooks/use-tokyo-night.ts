import { useLayoutEffect, useState } from 'react';

import { loggerServiceProxy } from '../../../logger';
import { windowServiceProxy } from '../../../services/window';
import { useObservable } from './use-observable';
import { useTheme } from './use-theme';

interface UseTokyoNightHook {
	isTokyoNightOn: boolean;
	toggleTokyoNight(): void;
}

export function useTokyoNight(): UseTokyoNightHook {
	const [isTokyoNightOn, setIsTokyoNightOn] = useState<boolean>(false);

	const { isDarkTheme } = useTheme();

	useLayoutEffect(() => {
		if (!isDarkTheme) {
			return;
		}

		windowServiceProxy().getTokyoNightStatus()
			.then((value) => {
				setIsTokyoNightOn(value);
			})
			.catch((error) => {
				loggerServiceProxy().error(
					'useTokyoNight.useLayoutEffect(): windowServiceIpc().getTokyoNightStatus() error',
					error
				);
			});
	});

	useObservable<boolean>(windowServiceProxy().tokyoNightSubject, setIsTokyoNightOn);

	const toggleTokyoNight = (): void => {
		if (!isDarkTheme) {
			return;
		}

		const toggleTokyoNightTimeout = 150;

		setTimeout(() => {
			windowServiceProxy().toggleTokyoNight()
				.catch((error) => {
					loggerServiceProxy().error(
						'useTokyoNight().toggleTokyoNight(): windowServiceProxy().toggleTokyoNight() error',
						error,
					);
				});
		}, toggleTokyoNightTimeout);
	};

	return { isTokyoNightOn, toggleTokyoNight };
}
