import { BrowserView, clipboard } from 'electron';
import contextMenu from 'electron-context-menu';

import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { getNavigationAction, NavigationAction } from '../../navigation/navigation-rules';
import { ignorePromise, isChartUrl, isSupportUrl } from '../../utils';
import { copyImageToClipboard } from '../../utils/copy-image';
import { localeService } from '../locale';
import i18n from '../locale/i18n';
import { userService } from '../user';
import { windowService } from '../window';
import { Tab } from '../window/tab/tab';
import { ContextMenuOpenInHandler } from './context-menu-openin-handler';
import { CONTEXT_MENU_SERVICE_CONTRACT, IContextMenuService, OpenInAction } from './icontext-menu-service';

@ExposeSingletonService(CONTEXT_MENU_SERVICE_CONTRACT, IpcServices.getProvider())
export class ContextMenuService implements IContextMenuService {
	private contextMenuOpenInHandler = new ContextMenuOpenInHandler();

	handleOpen(action: OpenInAction, url?: string, tabId?: string, title?: string): void {
		if (!url) {
			return;
		}
		const wnd = windowService().findWindow({ tabId });
		this.contextMenuOpenInHandler.handleOpenIn(action, url, wnd, title);
	}

	copyLink(link?: string): void {
		if (!link) {
			return;
		}
		const isChartOrSupportUrl = isChartUrl(link) || isSupportUrl(link);

		clipboard.writeText(
			isChartOrSupportUrl ? localeService().localeAwareUrl(link) : link,
			'clipboard'
		);
	}

	createContextMenu(tab: Tab, { webContents }: BrowserView): void {
		const navigationActions = [NavigationAction.Inplace, NavigationAction.OpenTab];

		const isMenuItemVisible = (url: string): boolean => navigationActions.indexOf(getNavigationAction(url)) > -1;

		const user = userService().getCurrentUser();

		contextMenu({
			window: webContents,
			prepend: (defaultActions, parameters) => {
				const wnd = windowService().findWindow({ tabId: tab.id });

				wnd?.triggerMenuCloseEvent('context-menu');

				return [
					{
						label: i18n.t('Open link in new tab'),
						visible: isMenuItemVisible(parameters.linkURL),
						click: () => {
							const currentTab = wnd?.activeTabId;
							if (!currentTab) {
								return;
							}

							this.contextMenuOpenInHandler.handleOpenIn(OpenInAction.NewTab, parameters.linkURL, wnd);
						},
					},
					{
						label: i18n.t('Open link in new window'),
						visible: !user.isAnonymous && isMenuItemVisible(parameters.linkURL),
						click: () => {
							if (!wnd) {
								return;
							}

							this.contextMenuOpenInHandler.handleOpenIn(OpenInAction.NewWindow, parameters.linkURL, wnd);
						},
					},
					{
						label: i18n.t('Open link in browser'),
						visible: parameters.linkURL !== '',
						click: () => {
							this.contextMenuOpenInHandler.handleOpenIn(OpenInAction.Browser, parameters.linkURL);
						},
					},
					{
						label: i18n.t('Undo'),
						role: 'undo',
						visible: parameters.isEditable,
					},
					{
						label: i18n.t('Redo'),
						role: 'redo',
						visible: parameters.isEditable,
					},
					{
						type: 'separator',
						visible: parameters.mediaType === 'image',
					},
					{
						label: i18n.t('Save image'),
						visible: parameters.mediaType === 'image',
						click: () => {
							loggerService().info('Screenshot context menu: Save image as');
							tab.downloadURL(parameters.srcURL);
						},
					},
					{
						label: i18n.t('Copy image'),
						visible: parameters.mediaType === 'image',
						click: (): void => {
							loggerService().info('Screenshot context menu: Copy image');
							ignorePromise(copyImageToClipboard(parameters.srcURL));
						},
					},
					{
						label: i18n.t('Copy image address'),
						visible: parameters.srcURL !== '',
						click: () => {
							loggerService().info('Screenshot context menu: Copy image address');
							clipboard.write({
								bookmark: parameters.srcURL,
								text: parameters.srcURL,
							});
						},
					},
				];
			},

			showLookUpSelection: false,
			showSearchWithGoogle: false,
			showCopyImage: false,
			showInspectElement: false,
			showCopyLink: false,
			showSelectAll: false,

			labels: {
				cut: i18n.t('Cut'),
				copy: i18n.t('Copy'),
				paste: i18n.t('Paste'),
				copyLink: i18n.t('Copy link'),
				learnSpelling: i18n.t('Learn Spelling'),
			},

			append: (defaultActions, parameters) => [
				{
					label: i18n.t('Select All'),
					role: 'selectAll',
					visible: parameters.isEditable,
				},
				{
					label: i18n.t('Copy link'),
					visible: Boolean(parameters.linkURL),
					click: () => {
						const isChartOrSupportUrl = isChartUrl(parameters.linkURL) || isSupportUrl(parameters.linkURL);

						clipboard.writeText(
							isChartOrSupportUrl
								? localeService().localeAwareUrl(parameters.linkURL)
								: parameters.linkURL, 'clipboard'
						);
					},
				},
			],
		});
	}
}
