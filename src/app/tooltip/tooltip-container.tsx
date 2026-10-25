import React from 'react';
import { withTranslation } from 'react-i18next';

import { TabTooltip } from './tooltip';

const TabTooltipWithTranslation = withTranslation()(TabTooltip);

export function TabTooltipContainer(): JSX.Element {
	return <TabTooltipWithTranslation />;
}
