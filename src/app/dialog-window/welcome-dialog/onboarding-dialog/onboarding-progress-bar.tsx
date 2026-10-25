import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from 'uuidv4';
import { svgIconcheckSize18pxStroke2pxTypeStroke as checkSvgIcon } from '@tradingview/ui-lib/icons/monochrome/check/size_18px__stroke_2px__type_stroke';
import { Typography } from '@tradingview/ui-lib/typography';

import { Icon } from '../../../components-ui/icon';
import { OnboardingStagesData } from './onboarding-dialog';

import './onboarding-progress-bar.css';

interface OnboardingProgressBarProps extends OnboardingStagesData {}

interface StageIndexData {
	index: number;
	key: string;
}

export const OnboardingProgressBar = ({ currentStageIndex, stagesAmount }: OnboardingProgressBarProps): JSX.Element => {
	const { t, i18n } = useTranslation();

	const stages: StageIndexData[] = useMemo(() =>
		Array.from({ length: stagesAmount }, (value, index) => index).map(
			(value) => ({ index: value, key: uuid() })
		), [stagesAmount]);

	return (
		<div className='onboarding-progress-bar'>
			<div className='onboarding-progress-bar-section'>
				<Typography
					tag='p'
					name='typography-accent-14px-semibold'
					className='onboarding-progress-bar-section-title'
				>
					{ t('Sign In') }
				</Typography>

				<div className='onboarding-progress-bar-stages'>
					<div className='onboarding-progress-bar-stage sign-in' />
					<Icon icon={ checkSvgIcon } className='onboarding-progress-bar-stage-check' />
					<div className='onboarding-progress-bar-stage sign-in' />
				</div>
			</div>

			<div className='onboarding-progress-bar-section'>
				<Typography
					tag='p'
					name='typography-accent-14px-semibold'
					className='onboarding-progress-bar-section-title active'
				>
					{ i18n.language !== 'en' ? t('Workspace setup and tips') : <>Workspace setup & tips</> }
				</Typography>

				<div className='onboarding-progress-bar-stages'>
					{ stages.map((stage: StageIndexData) =>
						<div
							key={ stage.key }
							className={ `onboarding-progress-bar-stage tip ${ currentStageIndex === stage.index ? 'active' : '' }` }
						/>
					) }
				</div>
			</div>
		</div>
	);
};
