import React from 'react';

import './element-positioner.css';

export const enum ElementPosition {
	Left = 'left',
	Right = 'right',
}

interface ElementPositionerProps {
	children: React.ReactNode;
	position: ElementPosition;
}

export const ElementPositioner = ({ children, position }: ElementPositionerProps): JSX.Element =>
	<div className={ `element-positioner ${ position }` }>
		{ children }
	</div>;
