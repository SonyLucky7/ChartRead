import React from 'react';
import { withTranslation } from 'react-i18next';

import { Licenses } from './licenses';

const LicensesWithTranslation = withTranslation()(Licenses);

export function LicensesContainer(): JSX.Element {
	return <LicensesWithTranslation />;
}
