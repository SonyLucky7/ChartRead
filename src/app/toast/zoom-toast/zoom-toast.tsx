import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar } from '@tradingview/ui-lib/snackbar/snackbar/snackbar';

import { windowServiceProxy } from '../../../services/window';
import { useObservable } from '../../components-ui/hooks';

import './zoom-toast.css';

export default (): JSX.Element => {
	const [zoom, setZoom] = useState<number>(1);
	const { t } = useTranslation();

	useObservable<number>(windowServiceProxy().zoomChange, setZoom);

	return (
		<Snackbar>
			<div className='zoom-toast'>
				{ `${ t('Zoom') } ${ Math.round(zoom * 100) }%` }
			</div>
		</Snackbar>
	);
};
