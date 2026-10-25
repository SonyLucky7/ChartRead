import { app } from 'electron';
import * as fs from 'fs';
import i18next from 'i18next';
import * as path from 'path';

import { findConfigFile } from '../services/configuration';
import { getPersistentChartUrl, getPersistentUrl, isChartUrl, isFileURI, makeFileURI, makeUrlRegExp, urlMatch } from '../utils';
import { jsonParse } from '../utils/json-parse';

export enum NavigationAction {
	Prevent,
	Inplace,
	OpenTab,
	OpenPopup,
	OpenWindow,
	OpenExternal,
}

type NavigationActionString = 'prevent' | 'inplace' | 'open-tab' | 'open-popup' | 'open-window' | 'open-external';

interface Rule {
	action: NavigationAction;
	currentUrl?: RegExp | RegExp[];
	url?: RegExp | RegExp[];
}

type RuleSet = Rule[];

type CommonRule = Required<Rule>;

interface EmbeddedLink {
	title: string;
	path: string;
}

export const enum PopupNavigationEvent {
	WillCreateWindow = 'will-create-window',
	WillNavigate = 'will-navigate',
	DidCreateWindow = 'did-create-window',
}

interface NavigationRulesConfig {
	['common-rules']: CommonRule[];
	dialog: Rule[];
	popup: {
		[PopupNavigationEvent.WillCreateWindow]: Rule[];
		[PopupNavigationEvent.WillNavigate]: Rule[];
		[PopupNavigationEvent.DidCreateWindow]: Rule[];
	};
	navigation: Rule[];
	['window-open']: Rule[];
	['new-window']: Rule[];
	embeddedLinks: Record<string, EmbeddedLink>;
}

function parseNavigationActionString(str: string): NavigationAction {
	if (typeof str === 'number') {
		return str;
	}

	switch (str) {
		case 'prevent': {
			return NavigationAction.Prevent;
		}
		case 'inplace': {
			return NavigationAction.Inplace;
		}
		case 'open-tab': {
			return NavigationAction.OpenTab;
		}
		case 'open-popup': {
			return NavigationAction.OpenPopup;
		}
		case 'open-window': {
			return NavigationAction.OpenWindow;
		}
		case 'open-external': {
			return NavigationAction.OpenExternal;
		}
		default: {
			throw new Error('Unknown navigation action string');
		}
	}
}

export function navigationActionToString(act: NavigationAction): NavigationActionString {
	switch (act) {
		case NavigationAction.Prevent: {
			return 'prevent';
		}
		case NavigationAction.Inplace: {
			return 'inplace';
		}
		case NavigationAction.OpenTab: {
			return 'open-tab';
		}
		case NavigationAction.OpenPopup: {
			return 'open-popup';
		}
		case NavigationAction.OpenWindow: {
			return 'open-window';
		}
		case NavigationAction.OpenExternal: {
			return 'open-external';
		}
		default: {
			act satisfies never;
			throw new Error('Unknown navigation action');
		}
	}
}

let navigationRulesConfig__: NavigationRulesConfig | undefined;

function getNavigationRulesConfig(): NavigationRulesConfig {
	if (!navigationRulesConfig__) {
		const configPath = findConfigFile('nav-rules.json');
		if (!configPath) {
			throw new Error('nav-rules.json config file not found');
		}

		const content = fs.readFileSync(configPath, { encoding: 'utf8' });
		const reviver = (key: string, value: unknown): unknown => {
			if (key === 'action') {
				if (typeof value === 'string') {
					return parseNavigationActionString(value);
				}

				throw new Error(`Unexpected value '${ JSON.stringify(value) }' for property '${ key }', expected a string`);
			}

			if (key === 'url' || key === 'currentUrl') {
				if (typeof value === 'string') {
					return makeUrlRegExp(value);
				}

				if (value instanceof Array) {
					return (value as string[]).map((v) => makeUrlRegExp(v));
				}

				throw new Error(`Unexpected value '${ JSON.stringify(value) }' for property '${ key }', expected a string or array of strings`);
			}

			return value;
		};
		const parsedContent: unknown = jsonParse(content, reviver);

		navigationRulesConfig__ = parsedContent as NavigationRulesConfig;
	}

	return navigationRulesConfig__;
}

function findNavigationAction(
	ruleSets: RuleSet[],
	targetUrl: string,
	currentUrl?: string,
): NavigationAction {
	for (const ruleSet of ruleSets) {
		const ruleFound = ruleSet.find((r) => {
			if (
				currentUrl && r.currentUrl &&
				!urlMatch(currentUrl, r.currentUrl)
			) {
				return false;
			}

			return !r.url || urlMatch(targetUrl, r.url);
		});

		if (ruleFound) {
			return ruleFound.action;
		}
	}

	return NavigationAction.Prevent;
}

function isChartNavigation(targetUrl: string, currentUrl?: string): boolean {
	return !!currentUrl && isChartUrl(targetUrl) && isChartUrl(currentUrl);
}

function isInplaceNavigation(targetUrl: string, currentUrl?: string): boolean {
	if (!currentUrl) {
		return false;
	}

	return getPersistentUrl(targetUrl) === getPersistentUrl(currentUrl);
}

export function getNavigationAction(targetUrl: string, currentUrl?: string): NavigationAction {
	if (isChartNavigation(targetUrl, currentUrl) || isInplaceNavigation(targetUrl, currentUrl)) {
		return NavigationAction.Inplace;
	}

	const navRulesConfig = getNavigationRulesConfig();

	const navigationAction = findNavigationAction(
		[
			navRulesConfig['common-rules'],
			navRulesConfig.navigation,
		],
		targetUrl,
		currentUrl,
	);

	return navigationAction;
}

export function getWindowOpenAction(targetUrl: string): NavigationAction {
	const navRulesConfig = getNavigationRulesConfig();

	const newPopupAction = findNavigationAction(
		[
			navRulesConfig['common-rules'],
			navRulesConfig['window-open'],
		],
		targetUrl,
	);

	return newPopupAction;
}

export function getDialogNavigationAction(targetUrl: string): NavigationAction {
	const navRulesConfig = getNavigationRulesConfig();

	const dialogNavigationAction = findNavigationAction(
		[
			navRulesConfig['common-rules'],
			navRulesConfig.dialog,
		],
		targetUrl,
	);

	return dialogNavigationAction;
}

export function getPopupNavigationAction(
	targetUrl: string,
	event: PopupNavigationEvent,
	currentUrl?: string,
): NavigationAction {
	const navRulesConfig = getNavigationRulesConfig();

	const popupNavigationAction = findNavigationAction(
		[
			navRulesConfig.popup[event],
		],
		targetUrl,
		currentUrl,
	);

	return popupNavigationAction;
}

export function getNewWindowNavigationAction(targetUrl: string, currentUrl: string): NavigationAction {
	const navRulesConfig = getNavigationRulesConfig();

	const action = findNavigationAction(
		[
			navRulesConfig['new-window'],
		],
		targetUrl,
		currentUrl,
	);

	return action;
}

export function resolveEmbeddedLink(url: string): EmbeddedLink | undefined {
	const tvdLinkRe__ = /^tvd:\/\/(\S+)$/;
	const matches = tvdLinkRe__.exec(url);
	if (matches === null || matches.length !== 2) {
		return undefined;
	}

	const name = matches[1];

	const links = getNavigationRulesConfig().embeddedLinks;
	const link: EmbeddedLink | undefined = name in links ? links[name] : undefined;
	if (!link) {
		return undefined;
	}

	const uri = path.join(app.getAppPath(), link.path);
	return {
		title: i18next.t(link.title),
		path: makeFileURI(uri),
	};
}

export function formatLink(url: string): string {
	const [urlWithoutRendererData] = url.split('?rendererInitialData');

	if (isFileURI(urlWithoutRendererData)) {
		return makeEmbeddedLink(urlWithoutRendererData);
	}

	return getPersistentChartUrl(url);
}

function makeEmbeddedLink(url: string): string {
	const links = getNavigationRulesConfig().embeddedLinks;
	for (const key of Object.getOwnPropertyNames(links)) {
		const link = links[key];
		if (url.endsWith(link.path)) {
			return `tvd://${ key }`;
		}
	}

	return url;
}
