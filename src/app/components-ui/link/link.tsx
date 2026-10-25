import React from 'react';
import linkColorMixin from '@tradingview/ui-lib/utils/mixin-class.css.json';

import '@tradingview/ui-lib/utils/mixin-class.css';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	name: 'link-colors'
	| 'link-colors-with-underline'
	| 'link-colors-secondary'
	| 'link-colors-secondary-with-underline';
}

export const Link = ({
	name,
	children,
	className,
	tabIndex = 0,
	...props
}: LinkProps): JSX.Element =>
	<a
		{ ...props }
		tabIndex={ tabIndex }
		className={ `${ linkColorMixin[name] } ${ linkColorMixin['focus-outline-rounded'] } ${ className ?? '' }` }
	>
		{ children }
	</a>;
