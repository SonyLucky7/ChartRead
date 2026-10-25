import React, { PropsWithChildren } from 'react';
import { DATA_IS_CONTEXT_ACTION } from '@tradingview/ui-lib/popovers/attrs';
import {
	useHorizontalMenuKeyboardNavigation,
} from '@tradingview/ui-lib/popovers/popover/popover-items-parts/horizontal-menu-item-part/horizontal-menu-item-part';

export const HorizontalNavigationItem = ({ children }: PropsWithChildren): JSX.Element => {
	const { onFocus, onKeyDown } = useHorizontalMenuKeyboardNavigation();
	return (
		<div onFocus={ onFocus } onKeyDown={ onKeyDown }>
			<span { ...{ [DATA_IS_CONTEXT_ACTION]: true } }>
				{ children }
			</span>
		</div>
	);
};
