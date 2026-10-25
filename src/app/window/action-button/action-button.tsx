import React from 'react';

import { MouseButton } from '../../../native/hardware';

import './action-button.css';

interface ActionButtonProps {
	onClick(ev: React.MouseEvent): void;
	icon: JSX.Element;
	id?: string;
	className?: string;
	onMouseMove?(ev: React.MouseEvent): void;
	onMouseLeave?(): void;
	title?: string;
}

export const ActionButton = ({
	onClick,
	icon,
	id,
	className = '',
	onMouseMove,
	onMouseLeave,
	title,
}: ActionButtonProps): JSX.Element => {
	const handleClick = (ev: React.MouseEvent): void => {
		if (ev.button !== MouseButton.Left) {
			return;
		}

		onClick(ev);
	};

	return (
		<button
			id={ id }
			onMouseUp={ handleClick }
			onMouseMove={ onMouseMove }
			onMouseLeave={ onMouseLeave }
			className={ `action-button ${ className }` }
			title={ title }
			tabIndex={ -1 }
		>
			{ icon }
		</button>
	);
};
