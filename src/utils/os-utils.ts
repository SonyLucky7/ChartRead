import { spawn } from 'child_process';
import { shell } from 'electron';
import { unlinkSync, writeFileSync } from 'fs';
import * as os from 'os';

import { loggerService } from '../logger';
import { getWindowsUpdateBuildRevision } from '../native';
import { getMessageOfError } from '../tvd-runtime/core';
import { ignorePromise } from './async';
import { isWin32 } from '.';

export function processRun(command: string, args: readonly string[]): Promise<{ output: string; code: number; }> {
	let output = '';

	return new Promise<{ output: string; code: number; }>((resolve, reject) => {
		const child = spawn(command, args, { stdio: 'pipe' });
		let finished = false;
		const setFinished = (): boolean => {
			if (finished) {
				return false;
			}

			finished = true;
			return true;
		};

		child.on('error', (error: Error) => {
			if (setFinished()) {
				reject(error);
			}
		});

		if (child.stdout) {
			child.stdout.setEncoding('utf-8');
			child.stdout?.on('data', (data: Buffer | string) => {
				output = output + (data instanceof Buffer ? data.toString('utf-8') : data);
			});
		}

		child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
			if (!setFinished()) {
				return;
			}

			if (signal) {
				reject(new Error(`Process terminated:${ signal }`));
			}

			resolve({ output, code: code === null ? -1 : code });
		});
	});
}

export const LINUXSNAP_SNAP = 'tradingview';
export const LINUXSNAP_CAMERA_INTERFACE = 'camera';
export const LINUXSNAP_PULSEAUDIO_INTERFACE = 'pulseaudio';

/**
 *
 */
export class LinuxSnap {
	static get isSnap(): boolean {
		return process.env.SNAP !== undefined;
	}

	/**
	 * Check that snap interface is connected.
	 * Can throw (because of processRun failure)!
	 *
	 * see about snactl usage:https://snapcraft.io/docs/using-snapctl#heading--interface-connections
	 */
	static async checkIsConnected(itfName: string): Promise<boolean> {
		const processResult = await processRun('snapctl', ['is-connected', itfName]);
		return processResult.code === 0;
	}
}

export type Win32SettingKind = 'privacy-webcam' | 'privacy-microphone' | 'privacy-notifications';
export interface WinVer {
	major: string;
	minor: string;
	build: string;
	updateBuildRevision: string;
}

export class Win32Utils {
	static displaySettingsPanel(kind?: Win32SettingKind): void {
		const uri = kind ? `ms-settings:${ kind }` : 'ms-settings:';
		ignorePromise(shell.openExternal(uri));
	}

	static windowsVersion(): WinVer {
		if (!isWin32()) {
			throw new Error('function is applicable only for windows');
		}
		const [major, minor, build] = os.release().split('.');

		const updateBuildRevision = getWindowsUpdateBuildRevision().toString();

		return { major, minor, build, updateBuildRevision };
	}
}

export function checkPathFileSavePermission(filePath: string): boolean {
	try {
		writeFileSync(filePath, 'test');
		unlinkSync(filePath);

		return true;
	}
	catch (err) {
		loggerService().error(`checkPathFileSavePermission() error: emits an error: ${ getMessageOfError(err) }`, err);
		return false;
	}
}
