import { WebContents } from 'electron';

import { webcontentTaskService } from '../../app/webcontent-based-tasks';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { AttachPersistentRoot, IPersistentObjectImplementation, PersistentObject } from '../../persistence';
import { ignorePromise } from '../../utils';
import { FEATURE_SERVICE_CONTRACT, IFeatureService } from './ifeature-service';

type FeatureListState = {
	[key: string]: { value: boolean; isChecked: boolean; };
};

@ExposeSingletonService(FEATURE_SERVICE_CONTRACT, IpcServices.getProvider())
@AttachPersistentRoot('featureList')
@PersistentObject
export class TVFeatureService implements IFeatureService, IPersistentObjectImplementation {
	featureList: FeatureListState = {};

	isFeatureEnabled(key: string, defaultValue: boolean): boolean {
		if (typeof this.featureList[key] === 'undefined') {
			ignorePromise(this.checkFeatureTaskHandler(key));
			return defaultValue;
		}

		if (!this.featureList[key].isChecked) {
			ignorePromise(this.checkFeatureTaskHandler(key));
		}

		return this.featureList[key].value;
	}

	internalExtractState(): FeatureListState {
		// eslint-disable-next-line no-return-assign
		Object.keys(this.featureList).forEach(key => this.featureList[key].isChecked = false);
		return this.featureList;
	}

	internalApplyState(state: unknown): void {
		this.featureList = state as FeatureListState;
	}

	private async checkFeatureTaskHandler(key: string): Promise<void> {
		const checkFeatureTask = async(webContents: WebContents): Promise<boolean> => {
			// eslint-disable-next-line no-useless-escape
			const functionString = `(function ${ this.featureEnabledHandler.toString() })(\'${ key }\')`;

			const res = await webContents
				.executeJavaScript(functionString) as boolean;

			return res;
		};

		const featureValueResponse = await webcontentTaskService().addTask(checkFeatureTask) as boolean;
		this.featureList[key] = {
			value: featureValueResponse,
			isChecked: true,
		};
	}

	private featureEnabledHandler(key: string): boolean {
		if (!window.TradingView) {
			return false;
		}

		return window.TradingView.isFeatureEnabled(key);
	}
}
