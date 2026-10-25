import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';

import { loggerServiceProxy } from '../../../../logger';
import { mainMenuServiceProxy } from '../../../../services/main-menu-service';
import { WindowEventsContext } from '../../../common/react-common';
import { useObservable } from '../../../components-ui/hooks';
import { ActionButton } from '../../action-button';

import './main-menu-button.css';

interface MainMenuButtonProps {
	icon: JSX.Element;
	isAppUpdateAvailable: boolean;
}

export const MainMenuButton = ({ icon, isAppUpdateAvailable }: MainMenuButtonProps): JSX.Element => {
	const { t } = useTranslation();
	const { windowId } = useContext(WindowEventsContext);

	const [isMainMenuOpened, setIsMainMenuOpened] = useState<boolean>(false);
	useObservable<boolean>(mainMenuServiceProxy().menuOpenedChange, setIsMainMenuOpened);

	const showMainMenu = (): void => {
		mainMenuServiceProxy().showMenu(windowId)
			.catch((error) => {
				loggerServiceProxy().error('<UserButton.showMainMenu()>: mainMenuServiceProxy().showMenu()', error);
			});
	};

	return isAppUpdateAvailable
		? <SquareButton
			onClick={ showMainMenu }
			size={ ButtonSize.XSmall }
			color={ ButtonColor.Green }
			variant={ ButtonVariant.Primary }
			endSlot={ icon }
			className={ `main-menu-update-app-button ${ isMainMenuOpened ? 'opened' : '' }` }
		>
			{ t('Update the app') }
		</SquareButton>
		: <ActionButton
			onClick={ showMainMenu }
			icon={ icon }
			id='main-menu-button'
			className={ `main-menu-button ${ isMainMenuOpened ? 'opened' : '' }` }
			title={ t('Main menu') }
		/>;
};
