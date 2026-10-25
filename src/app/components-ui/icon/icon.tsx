import React from 'react';
import { Icon as UILibIcon, IconProps } from '@tradingview/ui-lib/icon';

/**
 * @deprecated
 * BlockIcon from ui-lib should be used
 */
export const Icon = ({ className = '', ...props }: IconProps): JSX.Element =>
	<UILibIcon
		{ ...props }
		className={ `ui-lib-icon ${ className }` }
	/>;
