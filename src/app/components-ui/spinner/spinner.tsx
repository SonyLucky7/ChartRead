import React from 'react';

import './spinner.css';

interface SpinnerProps {
	primaryColor?: string;
	size?: number;
	secondaryColor?: string;
}

export const Spinner = ({ primaryColor = '#000000', size = 20, secondaryColor = 'transparent' }: SpinnerProps): JSX.Element =>
	<svg
		width={ size }
		height={ size }
		className='tvd-spinner'
		viewBox='0 0 24 24'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path d='M24 12a12 12 0 0 0-24 0h3a9 9 0 1 1 18 0h3Z' fill={ primaryColor } />
		<path d='M24 12a12 12 0 0 1-24 0h3a9 9 0 0 0 18 0h3Z' fill={ secondaryColor } />
	</svg>;
