import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@tradingview/ui-lib/typography';

import { ModalWindow } from '../../../components-ui/modal-window';

import IconExclamation from './assets/icon-exclamation.svg';

import './delete-layout-error-modal.css';

interface DeleteLayoutErrorModalProps {
	onCancel(): void;
}

export const DeleteLayoutErrorModal = ({ onCancel }: DeleteLayoutErrorModalProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<ModalWindow onCancel={ onCancel } className='delete-layout-error'>
			<IconExclamation />
			<Typography tag='h1' name='typography-accent-24px-semibold' className='modal-window-title'>
				{ t('Couldn\'t delete layout') }
			</Typography>
			<Typography tag='p' name='typography-regular-16px' className='modal-window-text'>
				{ t('Check your internet connection and try to delete it again') }
			</Typography>
		</ModalWindow>
	);
};
