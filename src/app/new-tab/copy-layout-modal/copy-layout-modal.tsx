import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../logger';
import { newTabServiceProxy } from '../../../services/new-tab';
import { RendererServiceData } from '../../../services/window/window-api';
import { getRendererInitialData } from '../../common/app-common';
import { ModalWindow } from '../../components-ui/modal-window';
import { TextInput } from '../../components-ui/text-input';
import { withPortal } from '../hocs';
import { COUNT_LIMIT } from '../new-product-tab';

interface CopyLayoutModalProps {
	isFavorite: boolean;
	layoutId: string;
	layoutName: string;
	onCancel(): void;
	openGoPro(): void;
}

export const CopyLayoutModal = withPortal(({
	isFavorite,
	layoutId,
	layoutName,
	openGoPro,
	onCancel,
}: CopyLayoutModalProps): JSX.Element => {
	const { t } = useTranslation();

	const modalRef = useRef<HTMLDivElement>(null);

	const [copyLayoutInput, setCopyLayoutInput] = useState<string>(layoutName ? `${ layoutName } copy` : 'copy');

	const handleSubmit = (): void => {
		if (!layoutId) {
			return;
		}

		const { tabId } = getRendererInitialData<RendererServiceData>();

		newTabServiceProxy().copyLayout({
			layoutName: copyLayoutInput.trim() || 'copy',
			layoutId,
			isFavorite,
			tabId,
		})
			.then((response) => {
				if (response === COUNT_LIMIT) {
					onCancel();
					openGoPro();
				}
			})
			.catch((error) => {
				loggerServiceProxy().error('<CopyLayoutModal>.handleSubmit(): newTabServiceProxy().copyLayout() error', error);
			});
	};

	return (
		<ModalWindow onCancel={ onCancel } modalRef={ modalRef }>
			<Typography
				tag='h1'
				name='typography-accent-20px-semibold'
				className='modal-window-title copy-layout-modal-window-title'
			>
				{ t('Copy chart layout') }
			</Typography>
			<TextInput
				value={ copyLayoutInput }
				onChange={ ({ target: { value } }) => { setCopyLayoutInput(value); } }
				autoFocus
				label={ t('Enter a new chart layout name') }
				maxLength={ 64 }
				size={ ControlSize.Medium }
				tabIndex={ 1 }
			/>
			<div className='modal-window-buttons'>
				<SquareButton
					onClick={ onCancel }
					size={ ButtonSize.Small }
					variant={ ButtonVariant.Secondary }
					color={ ButtonColor.Gray }
					tabIndex={ 3 }
				>
					{ t('Cancel') }
				</SquareButton>
				<SquareButton
					onClick={ handleSubmit }
					size={ ButtonSize.Small }
					variant={ ButtonVariant.Primary }
					color={ ButtonColor.Brand }
					tabIndex={ 2 }
				>
					{ t('Save') }
				</SquareButton>
			</div>
		</ModalWindow>
	);
});
