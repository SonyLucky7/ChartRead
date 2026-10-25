import React from 'react';
import { IconQuestionInformation, IconQuestionInformationIcon, IconQuestionInformationSize } from '@tradingview/ui-lib/icon-question-information/icon-question-information';
import { PopoverItem } from '@tradingview/ui-lib/popovers/popover/popover-items/popover-item/popover-item';
import { SwitchView } from '@tradingview/ui-lib/switch/switch-view';
import { Tooltip } from '@tradingview/ui-lib/tooltip/tooltip';
import { TooltipPlacements } from '@tradingview/ui-lib/tooltip/types';

import './linking-channel-switch.css';

interface LinkingChannelSwitchProps {
	title: string;
	tooltip: string;
	checked: boolean;
	onChange(): void;
	disabled?: boolean;
	tooltipOnDisabled?: string;
}

export const LinkingChannelSwitch = ({
	title,
	tooltip,
	checked,
	onChange,
	disabled = false,
	tooltipOnDisabled,
}: LinkingChannelSwitchProps): JSX.Element => {
	return (
		<PopoverItem
			onClick={ onChange }
			title={
				<>
					{ title }

					<Tooltip
						content={ <div className='linking-channel-switch-tooltip'>{ tooltip }</div> }
						placement={ TooltipPlacements.Top }
						delay={ 0 }
					>
						{ /* without the div tooltip is now shown */ }
						<div>
							<IconQuestionInformation
								ariaLabel={ `${ title } info tooltip` }
								icon={ IconQuestionInformationIcon.Info }
								size={ IconQuestionInformationSize.Small }
								tabIndex={ -1 }
							/>
						</div>
					</Tooltip>
				</>
			}
			// TODO: uncomment and use instead of the one below when color vars bug is fixed in DRG-2263:
			// works in ui-lib 1.4.2, but in ui-lib 1.4.2 css color vars are broken
			// rightSlot={
			// 	<Tooltip
			// 		content={ disabled ? tooltipOnDisabled : undefined }
			// 		placement={ TooltipPlacements.TopLeft }
			// 		delay={ 0 }
			// 	>
			// 		<div>
			// 			<SwitchView checked={ checked } disabled={ disabled } />
			// 		</div>
			// 	</Tooltip>
			// }
			rightSlot={
				disabled && tooltipOnDisabled !== undefined
					? <Tooltip
						content={ tooltipOnDisabled }
						placement={ TooltipPlacements.TopLeft }
						delay={ 0 }
					>
						{ /* without the div tooltip is now shown */ }
						<div>
							<SwitchView checked={ checked } disabled={ disabled } />
						</div>
					</Tooltip>
					: <SwitchView checked={ checked } disabled={ disabled } />
			}
			disabled={ disabled }
		/>
	);
};
