import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { ButtonColor, ButtonSize, ButtonVariant } from '@tradingview/ui-lib/buttons/types';
import { Typography } from '@tradingview/ui-lib/typography';

import { Spinner } from '../../../components-ui/spinner';

import './settings-warning.css';

interface SettingsWarningProps {
	warningText: string | null;
	onClick: (() => void) | null;
	customButtonText: string | null;
	isErrorWarning: boolean;
	isLoaderShowing: boolean;
}

export const SettingsWarning = ({
	warningText,
	onClick,
	customButtonText,
	isErrorWarning,
	isLoaderShowing,
}: SettingsWarningProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className='warning-section'>
			{ warningText &&
				<Typography
					tag='span'
					name='typography-regular-14px'
					className={ `warning-text ${ isErrorWarning ? 'error-message' : '' }` }
				>
					{ warningText }
				</Typography>
			}
			{ onClick &&
				<div className='warning-buttons'>
					<SquareButton
						size={ ButtonSize.Small }
						variant={ ButtonVariant.Primary }
						color={ ButtonColor.Black }
						onClick={ onClick }
					>
						{ isLoaderShowing
							? <Spinner />
							: customButtonText || t('Relaunch')
						}
					</SquareButton>
				</div>
			}
		</div>
	);
};
