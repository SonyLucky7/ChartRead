import { app } from 'electron';
import * as fs from 'fs';
import { join as pathJoin } from 'path';

import { localLoggerService } from '../logger';
import { getMessageOfError } from '../tvd-runtime/core';
import { CreateDirOptions, DeleteDirOptions, FileInformation } from './interfaces';

export type ElectronAppPathName = Parameters<typeof app.getPath>[0];
export type CriticalAppPathName = Extract<'temp' | 'userData' | 'appData', ElectronAppPathName>;

export type WriteStream = fs.WriteStream;

export class FileSystemProvider {
	static appStorageFolderName = 'TVAppStorage';
	static appUserStorageFolderName = 'TVUserStorage';
	static appStateFileName = 'appState.json';
	private static readonly encoding = 'utf8';

	static exists(path: string): boolean {
		return fs.existsSync(path);
	}

	static createDir(path: string, options: CreateDirOptions): void {
		fs.mkdirSync(path, options);
	}

	static deleteDir(path: string, options: DeleteDirOptions): void {
		return fs.rmdirSync(path, options);
	}

	static delete(path: string): void {
		fs.unlinkSync(path);
	}

	static deleteAsync(path: string): Promise<void> {
		return new Promise((resolve, reject) => {
			fs.unlink(path, (err) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	static writeFileAsync(path: string, data: unknown, flag?: string): Promise<void> {
		return fs.promises.writeFile(path, data as string | NodeJS.ArrayBufferView, { encoding: this.encoding, flag })
			.catch((err) => localLoggerService().error('Error while write file: ', err));
	}

	static readFileAsync(path: string, flag?: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			fs.readFile(path, { encoding: this.encoding, flag }, (err, data) => {
				if (err !== null) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}

	static readFileSync(path: string): string {
		return fs.readFileSync(path, { encoding: 'utf8' });
	}

	static readDirAsync(path: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			fs.readdir(path, { encoding: this.encoding }, (err, files) => {
				if (err !== null) {
					reject(err);
				}
				else {
					resolve(files);
				}
			});
		});
	}

	static readDirSync(path: string): string[] {
		return fs.readdirSync(path);
	}

	static fileStats(path: string, options?: fs.StatOptions): Promise<fs.Stats | fs.BigIntStats> {
		return new Promise((resolve, reject) => {
			fs.stat(path, options ?? { bigint: false }, (err, stats) => {
				if (err !== null) {
					reject(err);
				}
				else {
					resolve(stats);
				}
			});
		});
	}

	static async dirContentStats(path: string): Promise<FileInformation[]> {
		const dirContentPaths = await this.readDirAsync(path);

		return Promise.all(
			dirContentPaths.map(async p => {
				const fullPath = pathJoin(path, p);
				const stats = await this.fileStats(fullPath);

				return { fullPath, stats: stats as fs.Stats };
			})
		);
	}

	static makeAppDataPath(pathName: string): string {
		return pathJoin(FileSystemProvider.getDefaultCriticalAppPathOrThrow('appData'), app.getName(), pathName);
	}

	static makeAppRootPath(filename: string): string {
		const appDir = app.getAppPath();

		return pathJoin(appDir, filename);
	}

	static createWriteStream(path: string, options?: { flags: string; }): fs.WriteStream {
		return fs.createWriteStream(path, options);
	}

	// TODO: If we want to prohibit direct use of app.getPath we need to enforce that with custom ESlint rule
	static getDefaultAppPath(name: ElectronAppPathName): string | null {
		try {
			return app.getPath(name);
		}
		catch (error: unknown) {
			localLoggerService().error(`[FileSystemProvider.getDefaultAppPath()] Exception on getPath(${ name }): ${ getMessageOfError(error) }`);
		}
		return null;
	}

	static getDefaultCriticalAppPathOrThrow(name: CriticalAppPathName): string {
		return app.getPath(name);
	}

	/**
	 * Get application's document path:
	 * [UserDocuments]/TradingView.
	 *
	 * Seems sometimes path can be unavailable.
	 */
	static getAppDocumentsPath(): string | null {
		const documentsPath = FileSystemProvider.getDefaultAppPath('documents');
		return documentsPath ? pathJoin(documentsPath, app.getName()) : null;
	}

	static getAppUserStorageFolderPath(): string {
		return pathJoin(FileSystemProvider.getDefaultCriticalAppPathOrThrow('userData'), FileSystemProvider.appUserStorageFolderName);
	}

	static getAppStateFilePath(): string {
		const appUserDataPath = FileSystemProvider.getDefaultCriticalAppPathOrThrow('userData');
		const appStoragePath = pathJoin(appUserDataPath, FileSystemProvider.appStorageFolderName);
		if (!FileSystemProvider.exists(appStoragePath)) {
			FileSystemProvider.createDir(appStoragePath, {
				recursive: true,
			});
		}

		return pathJoin(appStoragePath, FileSystemProvider.appStateFileName);
	}
}

export function getTvUserFolderPath(userId: string): string {
	const tvUsersFolderPath = FileSystemProvider.getAppUserStorageFolderPath();
	const userStoragePath = pathJoin(tvUsersFolderPath, `id-${ userId }`);
	if (!FileSystemProvider.exists(userStoragePath)) {
		FileSystemProvider.createDir(userStoragePath, {
			recursive: true,
		});
	}

	return userStoragePath;
}
