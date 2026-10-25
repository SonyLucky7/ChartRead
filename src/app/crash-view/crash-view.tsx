import React, { Component } from 'react';
import { ButtonColor, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { intializeNativeInterop, shutdownNativeInterop } from '../../native';
import { CrashTestService, crashTestServiceProxy, ICrashTestService } from '../../services/crashtest-service';

import './crash-view.css';

intializeNativeInterop();

IpcServices.initializeRpc();

export default class CrashTestView extends Component {
	override componentWillUnmount(): void {
		shutdownNativeInterop();
	}

	private handleCrashMain(method: keyof ICrashTestService) {
		return () => {
			crashTestServiceProxy()[method]()
				.catch((error) => {
					loggerServiceProxy().error(`CrashTestView.handleCrashMain(): crashTestServiceProxy.${ method }`, error);
				});
		};
	}

	private handleCrashRenderer(method: keyof ICrashTestService) {
		return () => {
			const rendererCrashTestService = new CrashTestService();

			void rendererCrashTestService[method]();
		};
	}

	override render(): JSX.Element {
		return (
			<div className='crash-buttons-container'>
				<div className='process-container'>
					<span>Crash Main Process</span>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashMain('crashNativeProcess') }
					>
						Crash Main Process
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashMain('crashJs') }
					>
						Crash Main JS
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashMain('crashNativeModuleAV') }
					>
						Crash Main Native with Access Violation
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashMain('crashNativeModuleSO') }
					>
						Crash Main Native with Stack Overflow
					</SquareButton>
				</div>
				<div className='process-container'>
					<span>Crash Renderer Process</span>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashRenderer('crashNativeProcess') }
					>
						Crash Renderer Process
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashRenderer('crashJs') }
					>
						Crash Renderer JS
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashRenderer('crashNativeModuleAV') }
					>
						Crash Renderer Native with Access Violation
					</SquareButton>
					<SquareButton
						variant={ ButtonVariant.Secondary }
						color={ ButtonColor.Blue }
						onClick={ this.handleCrashRenderer('crashNativeModuleSO') }
					>
						Crash Renderer Native with Stack Overflow
					</SquareButton>
				</div>
			</div>
		);
	}
}
