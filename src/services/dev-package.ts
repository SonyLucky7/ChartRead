import { app } from 'electron';

const isDevVersion = app.getVersion().includes('dev');

export function isDevPackage(): boolean {
	return isDevVersion;
}
