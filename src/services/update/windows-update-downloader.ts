import { ParserOptions, parseStringPromise } from 'xml2js';
import { firstCharLowerCase } from 'xml2js/lib/processors';

import { get, HttpResponseCode } from '../../http';
import { loggerService } from '../../logger';
import { getConfiguration } from '../configuration';

export interface AppInstaller {
	version: string;
	uri: string;

	mainPackage: {
		name: string;
		processorArchitecture: string;
		publisher: string;
		uri: string;
		version: string;
	};

	updateSettings: {
		onLaunch: {
			hoursBetweenUpdateChecks: string;
		};
	};
}

const xmlParserOptions: ParserOptions = {
	trim: true,
	normalize: true,
	explicitRoot: false,
	mergeAttrs: true,
	explicitArray: false,
	attrNameProcessors: [firstCharLowerCase],
	tagNameProcessors: [firstCharLowerCase],
};

export async function downloadAppinstaller(): Promise<AppInstaller> {
	const urlFromConfig = getConfiguration().update.appInstallerUrl;

	loggerService().info(`Downloading appinstaller from "${ urlFromConfig }"`);

	let response = await get({
		url: urlFromConfig,
		cache: 'no-cache',
	});

	if (!response.data || response.code !== HttpResponseCode.OK) {
		throw new Error('Error while downloaded appinstaller.');
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	let appInstaller = (await parseStringPromise(response.data, xmlParserOptions)) as AppInstaller;

	if (appInstaller && appInstaller.uri !== urlFromConfig) {
		loggerService().info(`Detected new location of appinstaller. Downloading from "${ appInstaller.uri }"`);

		response = await get({
			url: appInstaller.uri,
			cache: 'no-cache',
		});

		if (!response.data || response.code !== HttpResponseCode.OK) {
			loggerService().error('Error while downloaded appinstaller from new location. Using donwloaded before.');
			return appInstaller;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		appInstaller = (await parseStringPromise(response.data, xmlParserOptions)) as AppInstaller;

		return appInstaller;
	}

	return appInstaller;
}
