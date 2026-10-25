import React, { Component } from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import { IpcServices } from '../../../ipc-services';
import { mainServiceProxy } from '../../../services/main-service';
import { ignorePromise } from '../../../utils';

import './version-info.css';

interface State {
	version: string;
	buildDate: string;
}

// https://www.unicode.org/charts/nameslist/n_0080.html#00B7
const DOT_CHAR = '\u00b7';

IpcServices.initializeRpc();

export class VersionInfo extends Component {
	override state: State = {
		version: '',
		buildDate: '',
	};

	override componentDidMount(): void {
		ignorePromise(this.initVersion());
	}

	private async initVersion(): Promise<void> {
		const versionInfo = await mainServiceProxy().getVersionInfo();
		const date = new Date(versionInfo.buildDate).toLocaleDateString();

		this.setState({ version: `Version ${ versionInfo.appVersion }`, buildDate: date });
	}

	override render(): JSX.Element {
		return (
			<Typography tag="div" name='typography-regular-24px' className="version-info splash-half-typography">
				{ `${ this.state.version } ${ this.state.version ? DOT_CHAR : '' } ${ this.state.buildDate }` }
			</Typography>
		);
	}
}
