import { Display } from 'electron';
import { Observable } from 'rxjs';

import { BuildInfo, ILicenses, IUndo } from '../interfaces';

export interface IMainService {
	displayScaleChange: Observable<Display>;
	readonly undo: IUndo;

	isDebugMode(): boolean;
	getVersionInfo(): Promise<BuildInfo>;
	getLicenses(): Promise<ILicenses | undefined>;
}

export const MAIN_SERVICE_CONTRACT = 'tvd:main-service';
