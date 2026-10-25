import { InstallationSource } from '../../utils/installation-source';
import { DialogActionType } from '../window/window-api';

type GeneralEventParams = {
	/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
	app_version: string;
	os: string;
	/**
	 * This is a technical parameter to force GA to count
	 * Otherwise, GA counts events without being tied to users
	 *
	 * @type {1} always 1 for GA to work correctly
	 */
	engagement_time_msec: 1;

	installation_source: InstallationSource;

	/**
	 * The parameter named debug_mode = 1 turns on debug mode in DebugView
	 *
	 * The value can be anything, as long as the property is sent, debug_mode is enabled
	 * @type {'1' }
	 */
	debug_mode?: '1';
	/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
}

type AnalyticsEventConstructor<EventName extends string, Parameters = unknown | undefined> = {
	eventName: EventName; parameters?: Parameters;
}

export type AnalyticsEvent = AnalyticsEventConstructor<'app_launched', AppLaunchedParams>
	| AnalyticsEventConstructor<'app_quit', AppQuitParams>
	| AnalyticsEventConstructor<'proxy_enabled' | 'proxy_disabled'>
	| AnalyticsEventConstructor<'unsavedTab_dialog_closed', UnsavedTabDialogClosed>
	| AnalyticsEventConstructor<'tabMenu_customizeTabTitle_clicked'>

export type GA4AnalyticsEvent = {
	name: AnalyticsEvent['eventName'];
	params: AnalyticsEvent['parameters'] | GeneralEventParams;
}

type AppLaunchedParams = {
	/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
	first_launch: 'yes' | 'no';
	display_count: number;
	start_tab_count: number;
	start_window_count?: number;
	theme: string;
	proxy: 'enabled' | 'disabled';
	tab_title: 'default' | 'customized';
	/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
}

type AppQuitParams = {
	/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
	session_length: number;
	max_window_count: number;
	/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
}

export type TabContent = 'chart' | 'pine' | 'videoidea' | 'screener'
type DialogType = 'close_single_tab' | 'reload_tab' | 'close_several_tabs'

type UnsavedTabDialogClosed = {
	/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
	dialog_type: DialogType;
	tab_content: TabContent;
	dialog_action: DialogActionType;
	/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
}

export interface IEventConverter<T> {
	toAnalyticsEvent(event: AnalyticsEvent, hasDevMode?: boolean): T;
}

export class GA4AnalyticsEventConverter implements IEventConverter<GA4AnalyticsEvent> {
	private appVersion: string;
	private osVersion: string;
	private installationSource: InstallationSource;

	constructor(appVersion: string, osVersion: string, installationSource: InstallationSource) {
		this.appVersion = appVersion;
		this.osVersion = osVersion;
		this.installationSource = installationSource;
	}

	toAnalyticsEvent(event: AnalyticsEvent, hasDevMode = false): GA4AnalyticsEvent {
		if (event.parameters) {
			const convertedEvent: GA4AnalyticsEvent = {
				name: event.eventName,
				params: {
					...event.parameters,
					/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
					app_version: this.appVersion,
					os: this.osVersion,
					engagement_time_msec: 1,
					installation_source: this.installationSource,
					...hasDevMode && { debug_mode: '1' },
					/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
				},
			};

			return convertedEvent;
		}

		const convertedEvent: GA4AnalyticsEvent = {
			name: event.eventName,
			params: {
				/* eslint-disable @typescript-eslint/naming-convention, camelcase  */
				app_version: this.appVersion,
				os: this.osVersion,
				engagement_time_msec: 1,
				installation_source: this.installationSource,
				...hasDevMode && { debug_mode: '1' },
				/* eslint-enable @typescript-eslint/naming-convention, camelcase  */
			},
		};

		return convertedEvent;
	}
}
