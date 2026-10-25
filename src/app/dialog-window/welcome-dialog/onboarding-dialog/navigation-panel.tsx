import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';

import { loggerServiceProxy } from '../../../../logger';
import { getDialogControl } from '../../../common/app-common';
import { OnboardingStage, OnboardingStagesData } from './onboarding-dialog';

import './navigation-panel.css';

interface NavigationPanelProps extends OnboardingStagesData {
	setCurrentStageIndex(stage: OnboardingStage): void;
}

export const NavigationPanel = ({ setCurrentStageIndex, currentStageIndex, stagesAmount }: NavigationPanelProps): JSX.Element => {
	const { t } = useTranslation();

	const onPrevButtonClick = (): void => {
		if (currentStageIndex === 0) {
			return;
		}

		setCurrentStageIndex(currentStageIndex - 1);
	};

	const onNextButtonClick = (): void => {
		const nextStageIndex = currentStageIndex + 1;

		if (nextStageIndex === stagesAmount) {
			getDialogControl().closeDialogWindow()
				.catch((error) => {
					loggerServiceProxy().error('<NavigationPanel>.onNextButtonClick(): getDialogControl().closeDialogWindow() error', error);
				});

			return;
		}

		setCurrentStageIndex(nextStageIndex);
	};

	const isFirstStage = currentStageIndex === 0;
	const isLastStage = currentStageIndex + 1 === stagesAmount;

	return (
		<>
			{ !isFirstStage &&
					<SquareButton
						size={ ButtonSize.Small }
						color={ ButtonColor.Gray }
						variant={ ButtonVariant.Secondary }
						onClick={ onPrevButtonClick }
						className='onboarding-navigation-button prev'
						tabIndex={ 1 }
					>
						{ t('Prev') }
					</SquareButton>
			}

			<SquareButton
				size={ ButtonSize.Small }
				color={ ButtonColor.Black }
				variant={ ButtonVariant.Primary }
				onClick={ onNextButtonClick }
				className='onboarding-navigation-button next'
				tabIndex={ 1 }
			>
				{ !isLastStage ? t('Next') : t('Got it') }
			</SquareButton>
		</>
	);
};
