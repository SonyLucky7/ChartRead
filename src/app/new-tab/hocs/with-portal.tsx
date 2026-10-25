import React from 'react';
import { createPortal } from 'react-dom';

interface WithPortal {
	isOpened: boolean;
	targetContainer?: Element | null;
}

export function withPortal<C>(
	Component: React.JSXElementConstructor<C>
): React.FC<C & WithPortal> {
	return (props): React.ReactElement => {
		if (!props.isOpened) {
			return <></>;
		}

		return createPortal(
			<Component { ...props } />,
			props.targetContainer ?? document.body,
		);
	};
}
