import { logCall, logCallName } from '../logger/log-decorator';
import { FileSystemProvider } from '../providers/file-system-provider';
import { Disposable } from '../tvd-runtime/core';

export interface IStorage extends Disposable {
	store(value: string): Promise<void>;
	restore(): Promise<string>;
	clear(): Promise<void>;
}

@logCallName('FileBasedStorage')
class FileBasedStorage implements IStorage {
	private readonly filePath: string;
	// private readonly _encoding = 'utf8';

	constructor(storagePath: string) {
		this.filePath = storagePath;
		// if (!fs.existsSync(this._storagePath)) {
		// 	fs.mkdirSync(this._storagePath);
		// }
	}

	@logCall
	store(value: string): Promise<void> {
		return FileSystemProvider.writeFileAsync(this.filePath, value);
	}

	@logCall
	restore(): Promise<string> {
		if (!FileSystemProvider.exists(this.filePath)) {
			return Promise.resolve('');
		}

		return FileSystemProvider.readFileAsync(this.filePath);
	}

	@logCall
	clear(): Promise<void> {
		if (FileSystemProvider.exists(this.filePath)) {
			FileSystemProvider.delete(this.filePath);
		}
		return Promise.resolve();
	}

	dispose(): void {
	}
}

export function createFileStorage(filePath: string): IStorage {
	return new FileBasedStorage(filePath);
}
