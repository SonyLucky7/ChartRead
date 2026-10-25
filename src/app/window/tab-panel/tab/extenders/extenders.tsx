import React from 'react';

import Extender from './assets/extender.svg';

import './extenders.css';

export const Extenders = (): JSX.Element =>
	<div className='extenders'>
		<div className='extender left'>
			<Extender />
		</div>

		<div className='extender right'>
			<Extender />
		</div>
	</div>;
