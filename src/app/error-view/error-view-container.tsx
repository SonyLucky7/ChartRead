import React from 'react';
import { withTranslation } from 'react-i18next';

import { ErrorView } from './error-view';

const ErrorViewTranslation = withTranslation()(ErrorView);

export function ErrorViewTransContainer(): JSX.Element {
	return <ErrorViewTranslation />;
}
