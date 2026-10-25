import React, { useState } from 'react';
import { BlockIcon } from '@tradingview/ui-lib/icon/block-icon';
import { svgIconmeatballsMenuSize28pxStroke1px as meatballsSvgIcon } from '@tradingview/ui-lib/icons/monochrome/meatballs-menu/size_28px__stroke_1px';
import { svgIconuserSize18pxStroke1pxTypeUser as userSmallSvgIcon } from '@tradingview/ui-lib/icons/monochrome/user/size_18px__stroke_1px__type_user';
import { svgIconuserSize28pxStroke1pxTypeUser as userSvgIcon } from '@tradingview/ui-lib/icons/monochrome/user/size_28px__stroke_1px__type_user';

import { networkServiceProxy } from '../../../main/network';
import { autoUpdateServiceProxy, UpdateStatus } from '../../../services/update';
import { ClaimsContainer, User, userServiceProxy } from '../../../services/user';
import { useObservable } from '../../components-ui/hooks';
import { TabPanelDivider } from '../tab-panel-divider';
import { BadConnectionIndicator } from './bad-connection-indicator';
import { MainMenuButton } from './main-menu-button';
import { NewWindowButton } from './new-window-button';

import './tab-panel-actions.css';

function getMainMenuIcon(currentUser: User, isAppUpdateAvailable: boolean): string {
	if (currentUser.id !== '') {
		return meatballsSvgIcon;
	}

	if (isAppUpdateAvailable) {
		return userSmallSvgIcon;
	}

	return userSvgIcon;
}

export const TabPanelActions = (): JSX.Element => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	useObservable<ClaimsContainer>(userServiceProxy().userChange, (claims: ClaimsContainer): void => {
		setCurrentUser(new User(claims));
	});

	const [isConnectionGood, setIsConnectionGood] = useState(true);
	useObservable<boolean>(networkServiceProxy().networkStatusChange, setIsConnectionGood);

	const [isAppUpdateAvailable, setIsAppUpdateAvailable] = useState<boolean>(false);
	useObservable<UpdateStatus>(autoUpdateServiceProxy().statusChange, (status) => {
		setIsAppUpdateAvailable(status === UpdateStatus.ReadyToInstall);
	});

	return (
		<div className='tab-panel-actions'>
			{ !isConnectionGood && <BadConnectionIndicator /> }
			{ !currentUser?.isAnonymous && <NewWindowButton /> }
			{ !currentUser?.isAnonymous && isAppUpdateAvailable === false && <TabPanelDivider /> }
			{ currentUser &&
				<MainMenuButton
					icon={ <BlockIcon icon={ getMainMenuIcon(currentUser, isAppUpdateAvailable) } /> }
					isAppUpdateAvailable={ isAppUpdateAvailable }
				/>
			}
		</div>
	);
};
