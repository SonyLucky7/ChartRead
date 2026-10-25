import { TFunction } from 'i18next';
import React, { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { loggerServiceProxy } from '../../../logger';
import { LayoutDrawingsCount, newTabServiceProxy } from '../../../services/new-tab';
import { getRendererInitialData } from '../../common/app-common';
import { ModalWindow } from '../../components-ui/modal-window';
import { withPortal } from '../hocs';
import { DeleteLayoutErrorModal } from './delete-layout-error-modal';

interface DeleteLayoutModalProps {
	layoutId: string;
	layoutName: string;
	onCancel(): void;
}

const enum FetchInfoStatus {
	Idle = 'idle',
	Success = 'success',
	Failure = 'failure',
}

const getLayoutDeletionText = (
	{ drawings, symbols }: LayoutDrawingsCount,
	layoutName: string,
	t: TFunction
): string => {
	if (drawings === 0 || drawings === 1) {
		return t(
			'Are you sure you want to delete chart layout "{{layoutName}}"? All information within this layout will be permanently lost.',
			{
				replace: { layoutName },
			}
		);
	}

	const drawingsText = t(
		'{{drawings}} drawing',
		{
			plural: '{{drawings}} drawings',
			count: drawings,
			replace: { drawings },
		}
	);
	const symbolsText = symbols > 1
		? ` ${ t('across {{symbols}} symbol', {
			plural: 'across {{symbols}} symbols',
			count: symbols,
			replace: { symbols },
		}) }`
		: '';

	return t(
		'Are you sure you want to delete chart layout "{{layoutName}}" containing {{drawingsInfo}}? All information within this layout will be permanently lost.',
		{
			replace: {
				layoutName,
				drawingsInfo: `${ drawingsText }${ symbolsText }`,
			},
		}
	);
};

export const DeleteLayoutModal = withPortal(({ layoutId, layoutName, onCancel }: DeleteLayoutModalProps): JSX.Element => {
	const { t } = useTranslation();

	const [drawingsCountStatus, setDrawingsCountStatus] = useState<FetchInfoStatus>(FetchInfoStatus.Idle);
	const [layoutDrawingsCount, setLayoutDrawingsCount] = useState<LayoutDrawingsCount>();

	useLayoutEffect(() => {
		if (!layoutId) {
			return;
		}

		const { userId } = getRendererInitialData<{ userId: string; }>();

		if (!userId) {
			return;
		}

		newTabServiceProxy().getLayoutDrawingsCount(layoutId, userId)
			.then((drawingsInfo) => {
				setLayoutDrawingsCount(drawingsInfo);
				setDrawingsCountStatus(FetchInfoStatus.Success);
			})
			.catch((error) => {
				loggerServiceProxy().error('<DeleteLayoutModal>.useEffect(): newTabServiceProxy().getInfoForDeletion() error', error);
				setDrawingsCountStatus(FetchInfoStatus.Failure);
			});
	}, [layoutId]);

	const handleSubmit = (): void => {
		newTabServiceProxy().deleteLayout(layoutId)
			.then(() => { onCancel(); })
			.catch((error) => {
				loggerServiceProxy().error('<DeleteLayoutModal>.handleSubmit(): newTabServiceProxy().deleteLayout() error', error);
			});
	};

	if (drawingsCountStatus === FetchInfoStatus.Idle) {
		return <></>;
	}

	if (drawingsCountStatus === FetchInfoStatus.Failure) {
		return (
			<DeleteLayoutErrorModal onCancel={ onCancel }/>
		);
	}

	return (
		<ModalWindow onCancel={ onCancel }>
			{ layoutDrawingsCount &&
				<>
					<Typography
						tag='h1'
						name='typography-accent-20px-semibold'
						className='modal-window-title delete-layout-modal-window-title'
					>
						{ t('Delete layout?') }
					</Typography>
					<Typography
						tag='p'
						name='typography-regular-16px'
						className='modal-window-text'
					>
						{ getLayoutDeletionText(layoutDrawingsCount, layoutName, t) }
					</Typography>
					<div className='modal-window-buttons'>
						<SquareButton
							onClick={ onCancel }
							size={ ButtonSize.Small }
							variant={ ButtonVariant.Secondary }
							color={ ButtonColor.Gray }
						>
							{ t('Cancel') }
						</SquareButton>
						<SquareButton
							onClick={ handleSubmit }
							size={ ButtonSize.Small }
							variant={ ButtonVariant.Primary }
							color={ ButtonColor.Red }
						>
							{ t('Delete permanently') }
						</SquareButton>
					</div>
				</>
			}
		</ModalWindow>
	);
});
