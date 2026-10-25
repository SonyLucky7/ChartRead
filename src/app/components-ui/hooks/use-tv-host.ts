import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loggerServiceProxy } from '../../../logger';
import { localeServiceProxy } from '../../../services/locale';
import { getTargetTVDHostInRenderer } from '../../../utils';

interface UseTVHostHook {
	tvHost: string;
	constructURLWithTVHost(urlPathname: string): string;
}

export function useTVHost(): UseTVHostHook {
	const { i18n } = useTranslation();

	const [tvHost, setTvHost] = useState<string>(getTargetTVDHostInRenderer());

	useEffect(() => {
		const getTVHost = async(): Promise<void> => {
			const currentTVHost = await localeServiceProxy().getLocaleAwareHost();

			setTvHost(currentTVHost);
		};

		getTVHost()
			.catch((error) => {
				loggerServiceProxy().error('useTVHost.useEffect(): getTVHost() error', error);
			});
	}, [i18n.language]);

	const constructURLWithTVHost = useCallback(
		(urlPathname: string) => `${ tvHost }${ urlPathname }/`,
		[tvHost],
	);

	return {
		tvHost,
		constructURLWithTVHost,
	};
}
