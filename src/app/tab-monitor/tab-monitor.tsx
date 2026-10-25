import React, { useEffect, useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { tabMonitoringServiceProxy, TabStatusData } from '../../services/tab-monitoring';

import './tab-monitor.css';

IpcServices.initializeRpc();

export default (): JSX.Element => {
	const [tabStatusData, setTabStatusData] = useState<TabStatusData[]>([]);

	useEffect(() => {
		const getTabStatusInterval = 1500;

		const intervalId = setInterval(() => {
			tabMonitoringServiceProxy().getTabStatus()
				.then(setTabStatusData)
				.catch((error) => {
					loggerServiceProxy().error('<TabMonitor>.useEffect: tabMonitoringServiceProxy().getTabStatus() error', error);
				});
		}, getTabStatusInterval);

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	const handleFreeze = (tabId: string): void => {
		tabMonitoringServiceProxy().freezeTabById(tabId)
			.catch((error) => {
				loggerServiceProxy().error('<TabMonitor>.handleFreeze error', error);
			});
	};

	return (
		<div className='tab-monitor'>
			<table className='tab-monitor-table'>
				<thead>
					<tr>
						<th>#</th>
						<th>PID</th>
						<th>Title</th>
						<th>Status</th>
						<th>Freeze button</th>
					</tr>
				</thead>
				<tbody>
					{ tabStatusData.map((tab, index) =>
						tab.pid === 0 || tab.pid === null
							? null
							: <tr key={ tab.pid }>
								<td>{ index + 1 }</td>
								<td>{ tab.pid }</td>
								<td>{ tab.title }</td>
								<td>{ tab.status }</td>
								<td>
									<SquareButton
										variant={ ButtonVariant.Primary }
										color={ ButtonColor.Gray }
										size={ ButtonSize.Small }
										stretch={ false }
										onClick={ () => handleFreeze(tab.id) }
									>
										freeze
									</SquareButton>
								</td>
							</tr>
					) }
				</tbody>
			</table>
		</div>
	);
};
