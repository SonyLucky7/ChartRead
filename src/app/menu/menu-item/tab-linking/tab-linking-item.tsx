import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { groupNames as linkColors } from '../../../../linking/group-names';
import { LINK_CHANNELS_CONFIG_LINKING_OFF, LinkChannelsConfig } from '../../../../linking/linkable';
import { loggerServiceProxy } from '../../../../logger';
import { TabLinkingState } from '../../../../services/window/window-features/with-menu';
import { LinkColor } from '../../../common/linking-colors';
import { LinkingChannelSwitch } from './linking-channel-switch';
import { LinkingColorButton } from './linking-color-button';

import './tab-linking-item.css';

interface TabLinkingItemProps {
	initialTabLinkingState: TabLinkingState;
	link(color: LinkColor): Promise<LinkChannelsConfig>;
	unlink(color: LinkColor): void;
	updateLinkChannelsConfig(channelsConfig: LinkChannelsConfig): Promise<void>;
	isChart: boolean;
	// TODO: remove in TVD-2871
	isTimeAndDateRangeSyncEnabled: boolean;
}

export const TabLinkingItem = ({
	initialTabLinkingState,
	link,
	unlink,
	updateLinkChannelsConfig,
	isChart,
	// TODO: remove in TVD-2871
	isTimeAndDateRangeSyncEnabled,
}: TabLinkingItemProps): JSX.Element => {
	const { t } = useTranslation();

	const [activeColor, setActiveColor] = useState<LinkColor | null>(initialTabLinkingState.color);
	const [syncSwitches, setSyncSwitches] = useState<LinkChannelsConfig>(initialTabLinkingState.channelsConfig);

	const handleColorClick = (color: LinkColor, isColorActive: boolean): void => {
		if (isColorActive) {
			setActiveColor(null);
			setSyncSwitches(LINK_CHANNELS_CONFIG_LINKING_OFF);
			unlink(color);
		}
		else {
			setActiveColor(color);
			link(color)
				.then(setSyncSwitches)
				.catch((error) => {
					loggerServiceProxy().error(
						`<TabLinkingItem>.handleColorClick(): link(groupName: ${ color }) error `,
						error,
					);
				});
		}
	};

	const handleChannelClick = (channel: keyof LinkChannelsConfig): void => {
		const prevSyncSwitches: LinkChannelsConfig = { ...syncSwitches };
		const newSyncSwitches: LinkChannelsConfig = {
			...prevSyncSwitches,
			[channel]: !syncSwitches[channel],
		};

		setSyncSwitches(newSyncSwitches);

		updateLinkChannelsConfig(newSyncSwitches)
			.catch((error) => {
				loggerServiceProxy().error('<TabLinkingItem>.handleChannelClick(): updateLinkChannelsConfig() error', error);
				setSyncSwitches(prevSyncSwitches);
			});
	};

	return (
		<>
			<ul className='linking-color-picker'>
				{ linkColors.map((color) => {
					const isColorActive = color === activeColor;

					return (
						<LinkingColorButton
							key={ color }
							color={ color }
							isActive={ isColorActive }
							onClick={ () => { handleColorClick(color, isColorActive); } }
						/>
					);
				}) }
			</ul>

			{ activeColor !== null &&
				<>
					<LinkingChannelSwitch
						title={ t('Symbol') }
						tooltip={ t('Changing the symbol updates it across all synced tabs with the same color tag') }
						checked={ syncSwitches.symbol }
						onChange={ () => { handleChannelClick('symbol'); } }
					/>
					<LinkingChannelSwitch
						title={ t('Interval') }
						tooltip={ t('Adjusting the interval updates it across all synced tabs with the same color tag') }
						checked={ syncSwitches.interval }
						onChange={ () => { handleChannelClick('interval'); } }
						disabled={ !isChart }
						tooltipOnDisabled={ t('Only available on chart tabs') }
					/>
					{ /* TODO: remove the condition in TVD-2871 */ }
					{ isTimeAndDateRangeSyncEnabled &&
						<>
							<LinkingChannelSwitch
								title={ t('Time') }
								tooltip={ t('Changing the point of time in a chart will sync this change to all tabs marked with the same color tag') }
								checked={ syncSwitches.time }
								onChange={ () => { handleChannelClick('time'); } }
								disabled={ !isChart }
								tooltipOnDisabled={ t('Only available on chart tabs') }
							/>
							<LinkingChannelSwitch
								title={ t('Date range') }
								tooltip={ t('Modifying the date range updates it across all tabs synced with the same color tag') }
								checked={ syncSwitches.dateRange }
								onChange={ () => { handleChannelClick('dateRange'); } }
								disabled={ !isChart }
								tooltipOnDisabled={ t('Only available on chart tabs') }
							/>
						</>
					}
				</>
			}
		</>
	);
};
