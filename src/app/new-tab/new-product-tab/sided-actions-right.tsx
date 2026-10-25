import React, { useEffect, useState } from 'react';

import { loggerServiceProxy } from '../../../logger';
import { newTabServiceProxy } from '../../../services/new-tab';
import { featureServiceProxy } from '../../../tv-services/feature';
import { SHOW_MCP_SERVER_LINKS } from '../../../tv-services/feature/ifeature-service';
import { ProductDrawerButton } from '../sided-actions/product-drawer-button';
import { SupportButton } from '../sided-actions/support-button';
import { ElementPosition, ElementPositioner } from './element-positioner';

import './sided-actions.css';

interface SidedActionsRightProps {
	onProductDrawerButtonClick(): void;
}

export const SidedActionsRight = ({ onProductDrawerButtonClick }: SidedActionsRightProps): JSX.Element => {
	const [isProductDrawerHintShown, setIsProductDrawerHintShown] = useState<boolean>(true);
	const [isTvMcpServerHintShown, setIsTvMcpServerHintShown] = useState<boolean>(true);
	// TODO: remove in TVD-3013
	const [isTvMcpServerFeatureEnabled, setIsTvMcpServerFeatureEnabled] = useState<boolean>(false);

	useEffect(() => {
		newTabServiceProxy().getShowProductDrawerHint()
			.then(setIsProductDrawerHintShown)
			.catch((error) => {
				loggerServiceProxy().error('<SidedActionsRight>.useEffect: NewTabServiceProxy.getShowProductDrawerHint', error);
			});

		newTabServiceProxy().getShowTvMcpServerHint()
			.then(setIsTvMcpServerHintShown)
			.catch((error) => {
				loggerServiceProxy().error('<SidedActionsRight>.useEffect: NewTabServiceProxy.getShowTvMcpServerHint', error);
			});

		featureServiceProxy().isFeatureEnabled(SHOW_MCP_SERVER_LINKS, false)
			.then(setIsTvMcpServerFeatureEnabled)
			.catch((error) => {
				loggerServiceProxy().error(`<SidedActionsRight>.useEffect: FeatureServiceProxy.isFeatureEnabled(${ SHOW_MCP_SERVER_LINKS })`, error);
			});
	}, []);

	const handleProductDrawerHintClose = (): void => {
		if (!isProductDrawerHintShown) {
			return;
		}

		setIsProductDrawerHintShown(false);
		newTabServiceProxy().setShowProductDrawerHint(false)
			.catch((error) => {
				loggerServiceProxy().error('<SidedActionsRight>.handleProductDrawerHintClose: NewTabServiceProxy.setShowProductDrawerHint', error);
			});
	};

	const isTvMcpServerHintVisible = !isProductDrawerHintShown && isTvMcpServerFeatureEnabled && isTvMcpServerHintShown;

	const handleTvMcpServerHintClose = (): void => {
		if (!isTvMcpServerHintVisible) {
			return;
		}

		setIsTvMcpServerHintShown(false);
		newTabServiceProxy().setShowTvMcpServerHint(false)
			.catch((error) => {
				loggerServiceProxy().error('<SidedActionsRight>.handleTvMcpServerHintClose: NewTabServiceProxy.setShowTvMcpServerHint', error);
			});
	};

	return (
		<ElementPositioner position={ ElementPosition.Right }>
			<div className='sided-actions-container'>
				<ProductDrawerButton
					isHintShown={ isProductDrawerHintShown }
					onHintClose={ handleProductDrawerHintClose }
					onClick={ onProductDrawerButtonClick }
				/>
				<SupportButton
					isHintShown={ isTvMcpServerHintVisible }
					onHintClose={ handleTvMcpServerHintClose }
					isTvMcpServerFeatureEnabled={ isTvMcpServerFeatureEnabled }
				/>
			</div>
		</ElementPositioner>
	);
};
