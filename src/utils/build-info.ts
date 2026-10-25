import { app } from 'electron';
import * as path from 'path';

import { loggerService } from '../logger';
import { FileSystemProvider } from '../providers/file-system-provider';
import { BuildInfo } from '../services/interfaces';
import { safeJsonParse } from './json-parse';

interface PackageJsonFile {
	name: string;
	version: string;
	buildDate: number;
}

const defaultPackageFile: PackageJsonFile = {
	name: 'tradingview-desktop',
	version: '',
	buildDate: 0,
};

async function readPackageJson(): Promise<PackageJsonFile | null> {
	const packagePath = path.join(app.getAppPath(), 'package.json');
	const packageString = await FileSystemProvider.readFileAsync(packagePath);

	if (!packageString) {
		loggerService().error(`Package.json was not found in ${ packagePath }`);
		return defaultPackageFile;
	}
	const isPackageJsonFile = (value: any): value is PackageJsonFile => {
		return typeof value === 'object' && 'version' in value;
	};
	const parsedPackage = safeJsonParse(isPackageJsonFile)(packageString);

	return parsedPackage;
}

export async function getBuildInfo(): Promise<BuildInfo> {
	const packageInfo = await readPackageJson();
	const appVersion = app.getVersion() ?? packageInfo?.version;
	const fallbackBuildDate = Date.now();

	return {
		appVersion,
		buildDate: packageInfo?.buildDate ?? fallbackBuildDate,
	};
}
