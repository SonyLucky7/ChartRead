import React from 'react';

import './download-icon.css';

interface DownloadIconProps {
	size?: number;
}

export const DownloadIcon = ({ size = 28 }: DownloadIconProps): JSX.Element =>
	<svg
		width={ size }
		height={ size }
		viewBox='0 0 28 28'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M7 20.5V16H6v4.5c0 .83.67 1.5 1.5 1.5h14c.83 0 1.5-.67 1.5-1.5V16h-1v4.5a.5.5 0 0 1-.5.5h-14a.5.5 0 0 1-.5-.5Z'
			fill='currentColor'
			stroke='currentColor'
			strokeWidth='.5'
		/>
		<path
			d='M15 16.3V5h-1v11.3l-3.15-3.15-.7.7 4 4 .35.36.35-.36 4-4-.7-.7L15 16.29Z'
			fill='currentColor'
			stroke='currentColor'
			strokeWidth='.5'
			className='download-icon-arrow'
		/>
	</svg>;
