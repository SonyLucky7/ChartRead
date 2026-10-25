import { app } from 'electron';
import * as fs from 'fs';
import { merge } from 'merge-anything';
import * as path from 'path';

import { localLoggerService, LogLevel } from '../logger';
import { FileSystemProvider } from '../providers/file-system-provider';
import { safeJsonParse } from '../utils/json-parse';
import { WINDOW_DEFAULT_WIDTH, WINDOW_HEADER_HEIGHT } from './window/window-api';

export interface Configuration {
	urls: {
		defaultHost: string;
		authHost: string;
		cookieName: string;
		chart: string;
		profile: string;
	};

	windows: {
		chartInitialWidth: number;
		chartInitialHeight: number;
		chartMinWidth: number;
		chartMinHeight: number;
		splash: {
			width: number;
			height: number;
			showDevTools?: boolean;
		};
	};

	logging: {
		file: {
			enabled: boolean;
			logLevel: LogLevel;
			maxFileSize: number;
		};
		console: {
			enabled: boolean;
			logLevel: LogLevel;
		};
	};

	persistence: {
		autoSaveInterval: number;
	};

	googleAnalytics: {
		key: string;
		measurementId: string;
		analyticsDevModeSettings: {
			isDevMode: false;
			devModeCid: '141456121'; // GA works in dev mode only for existing users, '141456121' is a mock id
		};
	};

	sentry: {
		dsn: string;
		upload: boolean;
	};

	advanced: {
		debugMode: boolean;
		disableAppOnboarding: boolean;
		concurrencyLimit: number;
		windowLoadTimeout: number;
		infoRequestTimeout: number;
		hostUrls?: string[];
		dohProviders?: string[];
	};

	authentication: {
		waitRedirectTimeout: number;
	};

	update: {
		// Windows only
		appInstallerUrl: string;
		// Windows and MacOS only
		forceDevUpdate: boolean;
		// MacOS only
		appUpdateYmlPath?: string;
	};
}

export type ConfigProvider = (filename: string) => string | undefined;

let configProvider__: ConfigProvider | undefined;

export function setConfigProvider(provider: ConfigProvider | undefined): void {
	if (configProvider__ && provider) {
		throw new Error('Custom config provider already set');
	}
	configProvider__ = provider;
}

export function resetConfigProvider(): void {
	configProvider__ = undefined;
}

function defaultConfigProvider(filename: string): string | undefined {
	const EMPTY = '';
	const appDocumentsPath = FileSystemProvider.getAppDocumentsPath();

	const searchRootPaths = [
		appDocumentsPath ? path.join(appDocumentsPath, 'configs') : EMPTY,
		path.join(app.getAppPath(), 'configs'),
	];

	for (const basePath of searchRootPaths) {
		if (basePath === EMPTY) {
			continue;
		}

		const configPath = path.join(basePath, filename);
		localLoggerService().debug(`Check config path: '${ configPath }'`);

		if (fs.existsSync(configPath)) {
			localLoggerService().info(`Use config path: '${ configPath }'`);
			return configPath;
		}
	}

	return undefined;
}

export function findConfigFile(filename: string): string | undefined {
	return configProvider__ ? configProvider__(filename) : defaultConfigProvider(filename);
}

function updateConfigFromEnvironment(config: Configuration): void {
	const envToBoolean = (envName: string, defaultValue: boolean): boolean => {
		const value = process.env[envName];
		if (!value) {
			return defaultValue;
		}

		return value === '1' || (/^true$/i).test(value);
	};

	const envToString = (envName: string, defaultValue: string): string => {
		const value = process.env[envName];
		if (!value) {
			return defaultValue;
		}

		return value;
	};

	const TVD_HOST = 'TVD_HOST';
	const TVD_SESSION_COOKIE = 'TVD_SESSION_COOKIE';
	const TVD_DEBUGMODE = 'TVD_DEBUGMODE';
	const TVD_SENTRY_FORCE_UPLOAD = 'TVD_SENTRY_FORCE_UPLOAD';
	const TVD_SENTRY_DSN = 'TVD_SENTRY_DSN';

	if (TVD_HOST in process.env) {
		config.urls.defaultHost = process.env[TVD_HOST] ?? config.urls.defaultHost;
		localLoggerService().debug(`Configuration.updateConfigFromEnvironment(): "TVD_HOST: ${ config.urls.defaultHost }"`);
	}

	if (TVD_SESSION_COOKIE in process.env) {
		config.urls.cookieName = process.env[TVD_SESSION_COOKIE] ?? config.urls.cookieName;
	}

	config.advanced.debugMode = envToBoolean(TVD_DEBUGMODE, config.advanced.debugMode);
	localLoggerService().debug(`Configuration.updateConfigFromEnvironment(): "TVD_DEBUGMODE: ${ config.advanced.debugMode }"`);

	const sentryForceUpload = envToBoolean(TVD_SENTRY_FORCE_UPLOAD, config.sentry.upload);
	config.sentry.upload = !config.advanced.debugMode || sentryForceUpload;
	config.sentry.dsn = envToString(TVD_SENTRY_DSN, config.sentry.dsn);
}

function loadConfiguration(): Configuration {
	let config: Configuration = {
		urls: {
			defaultHost: 'https://tradingview.com/',
			authHost: 'https://auth.tradingview.com',
			cookieName: 'sessionid',
			chart: 'chart/',
			profile: 'u/',
		},
		windows: {
			chartInitialWidth: WINDOW_DEFAULT_WIDTH,
			chartInitialHeight: WINDOW_HEADER_HEIGHT,
			chartMinWidth: 1000,
			chartMinHeight: 700,
			splash: {
				width: 450,
				height: 450,
			},
		},
		logging: {
			file: {
				enabled: true,
				logLevel: LogLevel.Debug,
				maxFileSize: 100,
			},
			console: {
				enabled: true,
				logLevel: LogLevel.Debug,
			},
		},
		persistence: {
			autoSaveInterval: 300000,
		},
		googleAnalytics: {
			key: '3LizEk59Qly60mrqxTq8Fw',
			measurementId: 'G-6BZN5RZ7W7', // GA works in dev mode only for existing users, '141456121' is a mock id
			analyticsDevModeSettings: {
				isDevMode: false,
				devModeCid: '141456121',
			},
		},
		sentry: {
			dsn: '',
			upload: false,
		},
		advanced: {
			debugMode: false,
			disableAppOnboarding: false,
			concurrencyLimit: 2,
			windowLoadTimeout: 30000,
			infoRequestTimeout: 60000,
		},
		authentication: {
			waitRedirectTimeout: 120000,
		},
		update: {
			appInstallerUrl: 'https://tvd-packages.tradingview.com/stable/latest/win32/TradingView.appinstaller',
			forceDevUpdate: false,
		},
	};

	const configPath = findConfigFile('config.json');
	if (configPath) {
		const content = fs.readFileSync(configPath, { encoding: 'utf8' });
		const isConfiguration = (value: any): value is Configuration => {
			return typeof value === 'object' && 'windows' in value;
		};
		const parsedConfig = safeJsonParse(isConfiguration)(content);
		if (!parsedConfig) {
			localLoggerService().error('Configuration.loadConfiguration(): JSON.parse error');
		}
		else {
			config = merge(config, parsedConfig);
		}
	}
	else {
		localLoggerService().warn('Configuration.loadConfiguration(): "Configuration file not found, will use default configuration"');
	}

	updateConfigFromEnvironment(config);

	const expandUrl = (url: string): string => {
		if (url.startsWith('http')) {
			return url;
		}
		return config.urls.defaultHost + url;
	};

	config.urls.chart = expandUrl(config.urls.chart);
	config.urls.profile = expandUrl(config.urls.profile);

	return config;
}

let config__: Configuration | undefined;

export function getConfiguration(): Configuration {
	if (!config__) {
		config__ = loadConfiguration();
	}

	return config__;
}
