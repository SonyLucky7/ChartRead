import { BrowserWindow } from 'electron';
import i18next, { TFunction } from 'i18next';
import { ButtonColor, ButtonVariant } from '@tradingview/ui-lib/buttons/types';

import { Credentials, passwordManagerService } from '../services/password-manager';
import { getTabContent, trackEventService } from '../services/track-event-service';
import { WindowCloseStatus } from '../services/window';
import { DialogWindow, NO_BUTTON_ACTION } from '../services/window/dialog-window';
import { TvTab } from '../services/window/tab/tv-tab';
import { CommonDialogData, CredentialsDialogData, DialogActionType, DialogButton, DialogWindowSize, InputSnapshot } from '../services/window/window-api';
import { isDarwin, isDefaultChart, isWin32 } from '.';

interface CommonDialogButtons {
	cancelButton: DialogButton;
	closeButton: DialogButton;
}

export enum CloseOrReloadUnsavedChart {
	Close = 'Close',
	SaveOrReload = 'SaveOrReload',
	ClosePopup = 'ClosePopup',
}

export type ConfirmLabel = 'update' | 'save';

function getCommonDialogButtons(t: TFunction): CommonDialogButtons {
	const cancelButton: DialogButton = {
		id: DialogActionType.Cancel,
		text: t('Cancel'),
		color: ButtonColor.Gray,
		variant: ButtonVariant.Secondary,
	};

	const closeButton: DialogButton = {
		id: DialogActionType.Close,
		text: t('Close'),
		color: ButtonColor.Black,
		variant: ButtonVariant.Primary,
	};

	return { cancelButton, closeButton };
}

export async function askCredentialsSave(enteredCredentials: Credentials, window?: BrowserWindow): Promise<InputSnapshot | undefined> {
	const credentials = await passwordManagerService().getCredentialsByService();
	const existingCredentials = credentials && credentials.find(c => c.account === enteredCredentials.account);

	if (existingCredentials && existingCredentials.password === enteredCredentials.password) {
		return;
	}

	const dialogTitle = existingCredentials ? i18next.t('Update saved password for') : i18next.t('Save credentials?');
	const applyButtonLabel = existingCredentials ? i18next.t('Update') : i18next.t('Save');

	const dialogData = new CredentialsDialogData(
		enteredCredentials,
		Boolean(existingCredentials),
		undefined,
		dialogTitle,
		'',
		[
			getCommonDialogButtons(i18next.t).cancelButton,
			{
				id: DialogActionType.Update,
				text: applyButtonLabel,
				color: ButtonColor.Black,
				variant: ButtonVariant.Primary,
			},
		]
	);

	const wndWidth = 400;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const wndHeightWin32 = existingCredentials ? 247 : 299;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const wndHeightDarwin = existingCredentials ? 219 : 271;

	let size: DialogWindowSize = {
		width: wndWidth,
		height: isWin32() ? wndHeightWin32 : wndHeightDarwin,
	};

	if (existingCredentials) {
		const customDialogWidth = {
			de: 460,
			es: 450,
			fr: 490,
			ms: 500,
			ru: 420,
		};

		const customDialogSizes = new Map<string, Partial<DialogWindowSize>>([
			['de_DE', { width: customDialogWidth.de }],
			['es', { width: customDialogWidth.es }],
			['fr', { width: customDialogWidth.fr }],
			['ms_MY', { width: customDialogWidth.ms }],
			['ru', { width: customDialogWidth.ru }],
		]);

		const customDialogSize = customDialogSizes.get(i18next.language);
		if (customDialogSize !== undefined) {
			size = { ...size, ...customDialogSize };
		}
	}

	const choice = await DialogWindow.showDialogWindow({
		size,
		data: dialogData,
		parentWindow: window,
		isModal: false,
		closeOnSubmit: true,
	});

	return choice;
}

const getChoice = async(
	dialogData: CommonDialogData,
	window: BrowserWindow,
	reload?: boolean,
): Promise<InputSnapshot> => {
	let size: DialogWindowSize = {
		width: 480,
		height: 226,
	};

	const customDialogWidth = {
		/* eslint-disable @typescript-eslint/no-magic-numbers */
		de: 545,
		es: 540,
		fr: reload ? 545 : 570,
		id: 540,
		ms: reload ? 560 : 570,
		kr: reload ? 480 : 490,
		pl: reload ? 580 : 635,
		ru: 600,
		tr: 540,
		/* eslint-enable @typescript-eslint/no-magic-numbers */
	};
	const customDialogHeight = 250;

	const customDialogSizes = new Map<string, Partial<DialogWindowSize>>([
		['de_DE', { width: customDialogWidth.de }],
		['es', { width: customDialogWidth.es }],
		['fr', { width: customDialogWidth.fr }],
		['id', { width: customDialogWidth.id, height: customDialogHeight }],
		['ms_MY', { width: customDialogWidth.ms }],
		['kr', { width: customDialogWidth.kr }],
		['pl', { width: customDialogWidth.pl }],
		['ru', { width: customDialogWidth.ru }],
		['tr', { width: customDialogWidth.tr }],
	]);

	const customDialogSize = customDialogSizes.get(i18next.language);
	if (customDialogSize !== undefined) {
		size = { ...size, ...customDialogSize };
	}

	return await DialogWindow.showDialogWindow({ data: dialogData, size, isModal: isDarwin(), parentWindow: window, closeOnBlur: true, closeOnSubmit: true });
};

const getMessage = (overrideMessage?: string): string => {
	const chartUnsavedWarningMessage = 'The Chart Layout includes unsaved changes. You will lose your data if you leave the page.';

	if (!overrideMessage || overrideMessage === chartUnsavedWarningMessage) {
		return i18next.t('There are unsaved changes on your chart layout. You will lose them if you close the tab.');
	}

	if (overrideMessage.includes('Video is being recorded')) {
		return i18next.t('Video is being recorded. Are you sure you want to leave this page?');
	}

	return overrideMessage;
};

export async function askUserToCloseUnsavedChartTab(window: BrowserWindow, canCloseAll: boolean, url: string = '', overrideMessage?: string): Promise<WindowCloseStatus> {
	const { cancelButton, closeButton } = getCommonDialogButtons(i18next.t);

	const singleTabCloseButtons: DialogButton[] = [
		cancelButton,
		closeButton,
	];
	const multipleTabsCloseButtons: DialogButton[] = [
		cancelButton,
		{
			id: DialogActionType.CloseAll,
			text: i18next.t('Close all'),
			color: ButtonColor.Black,
			variant: ButtonVariant.Secondary,
		},
		closeButton,
	];

	const dialogData = new CommonDialogData(
		i18next.t('Close tab?'),
		getMessage(overrideMessage),
		canCloseAll ? multipleTabsCloseButtons : singleTabCloseButtons
	);
	const tabContent = getTabContent(url, overrideMessage);

	const choice = await getChoice(dialogData, window);

	trackEventService().trackEvent({
		eventName: 'unsavedTab_dialog_closed',
		parameters: {
			/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
			dialog_type: canCloseAll ? 'close_several_tabs' : 'close_single_tab',
			tab_content: tabContent,
			dialog_action: choice?.dialogAction ?? DialogActionType.Cancel,
			/* eslint-enable camelcase, @typescript-eslint/naming-convention*/
		},
	});

	return {
		mayClose: choice.button === 1 || choice.button === 2,
		closeToAll: canCloseAll ? choice.button === 1 : false,
	};
}

export async function askUserToCloseOrToReloadUnsavedChart(
	window: BrowserWindow,
	tab: TvTab,
	isReload: boolean,
	hasAuth: boolean,
	overrideMessage?: string
): Promise<CloseOrReloadUnsavedChart> {
	const buttons: DialogButton[] = isReload
		? [
			{
				id: DialogActionType.SaveAndReload,
				text: i18next.t('Save and reload'),
				color: ButtonColor.Gray,
				variant: ButtonVariant.Secondary,
			},
			{
				id: DialogActionType.ReloadWithoutSaving,
				text: hasAuth
					? i18next.t('Reload without saving')
					: i18next.t('Reload'),
				color: ButtonColor.Black,
				variant: ButtonVariant.Primary,
			},
		]
		: [
			{
				id: DialogActionType.SaveAndClose,
				text: i18next.t('Save and close'),
				color: ButtonColor.Gray,
				variant: ButtonVariant.Secondary,
			},
			{
				id: DialogActionType.CloseWithoutSaving,
				text: hasAuth
					? i18next.t('Close without saving')
					: i18next.t('Close'),
				color: ButtonColor.Black,
				variant: ButtonVariant.Primary,
			},
		];

	let isDefaultChartUrl = false;

	if (tab.url) {
		isDefaultChartUrl = isDefaultChart(tab.url);
	}

	if (!hasAuth || isDefaultChartUrl) {
		buttons.shift();
	}

	const tabContent = getTabContent(tab.url, overrideMessage);

	const dialogData = new CommonDialogData(
		isReload ? i18next.t('Reload tab?') : i18next.t('Close tab?'),
		getMessage(overrideMessage),
		buttons
	);

	const choice = await getChoice(dialogData, window, isReload);

	trackEventService().trackEvent({
		eventName: 'unsavedTab_dialog_closed',
		parameters: {
			/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
			dialog_type: isReload ? 'reload_tab' : 'close_single_tab',
			tab_content: tabContent,
			dialog_action: choice?.dialogAction ?? DialogActionType.Unknown,
			/* eslint-enable camelcase, @typescript-eslint/naming-convention*/
		},
	});

	if (!hasAuth) {
		return choice.button === 0 ? CloseOrReloadUnsavedChart.Close : CloseOrReloadUnsavedChart.ClosePopup;
	}

	if (choice.button === NO_BUTTON_ACTION) {
		return CloseOrReloadUnsavedChart.ClosePopup;
	}

	return choice.button === 0 ? CloseOrReloadUnsavedChart.SaveOrReload : CloseOrReloadUnsavedChart.Close;
}

export async function askUserToCloseGroup(window: BrowserWindow): Promise<boolean> {
	const { cancelButton, closeButton } = getCommonDialogButtons(i18next.t);

	const dialogData = new CommonDialogData(
		i18next.t('Close this group?'),
		i18next.t('There are unsaved changes on your charts layouts. You will lose them if you close the group.'),
		[cancelButton, closeButton]
	);

	const choice = await getChoice(dialogData, window);

	// the close button is the second one; a cancel/cross/blur keeps the group active
	return choice.button === 1;
}
