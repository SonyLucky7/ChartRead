import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../../logger';
import { newTabServiceProxy } from '../../../../services/new-tab';
import { RendererServiceData } from '../../../../services/window/window-api';
import { getRendererInitialData } from '../../../common/app-common';
import { ModalWindow } from '../../../components-ui/modal-window';
import { TextInput } from '../../../components-ui/text-input';
import { withPortal } from '../../hocs';
import { COUNT_LIMIT } from '../../new-product-tab';

interface CreateLayoutModalProps {
	onCancel(): void;
	openGoProModal(): void;
}

// TODO: use for name prop of ModalWindow in TVD-2736
const modalName = 'create_layout';

export const CreateLayoutModal = withPortal(({ onCancel, openGoProModal }: CreateLayoutModalProps): JSX.Element => {
	const { t } = useTranslation();

	const [createLayoutInput, setCreateLayoutInput] = useState<string>('');

	const handleCancel = (): void => {
		loggerServiceProxy().info(`<ModalWindow>: ${ modalName } modal was closed with cancel button`);
		onCancel();
	};

	const handleSubmit = (): void => {
		loggerServiceProxy().info(`<ModalWindow>: ${ modalName } modal was submitted`);

		newTabServiceProxy().createLayout(
			createLayoutInput.trim(),
			getRendererInitialData<RendererServiceData>().tabId
		)
			.then((response) => {
				if (response === COUNT_LIMIT) {
					onCancel();
					openGoProModal();
				}
			})
			.catch((error) => {
				loggerServiceProxy().error('<CreateLayoutModal>.handleSubmit(): newTabServiceProxy().createLayout() error', error);
			});
	};

	const isSubmitDisabled = createLayoutInput.trim().length === 0;

	return (
		<ModalWindow onCancel={ onCancel }>
			<Typography
				tag='h1'
				name='typography-accent-20px-semibold'
				className='modal-window-title'
			>
				{ t('Create new layout') }
			</Typography>
			<TextInput
				value={ createLayoutInput }
				onChange={ ({ target: { value } }) => { setCreateLayoutInput(value); } }
				autoFocus
				label={ t('Layout name') }
				maxLength={ 64 }
				placeholder={ t('My layout') }
				size={ ControlSize.Medium }
				tabIndex={ 1 }
			/>
			<div className='modal-window-buttons'>
				<SquareButton
					onClick={ handleCancel }
					color={ ButtonColor.Gray }
					variant={ ButtonVariant.Secondary }
					size={ ButtonSize.Small }
					tabIndex={ 3 }
				>
					{ t('Cancel') }
				</SquareButton>
				<SquareButton
					onClick={ handleSubmit }
					color={ ButtonColor.Brand }
					variant={ ButtonVariant.Primary }
					size={ ButtonSize.Small }
					disabled={ isSubmitDisabled }
					tabIndex={ isSubmitDisabled ? -1 : 2 }
				>
					{ t('Create') }
				</SquareButton>
			</div>
		</ModalWindow>
	);
});
