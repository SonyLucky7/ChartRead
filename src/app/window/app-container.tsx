import React from 'react';
import { withTranslation } from 'react-i18next';

import { App } from './app';

const AppWithTranslation = withTranslation()(App);

export function AppContainer(): JSX.Element {
	return <AppWithTranslation useSuspense={ false }/>;
}
