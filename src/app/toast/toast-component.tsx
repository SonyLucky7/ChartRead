import React, { Component } from 'react';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { Dimensions } from '../../services/interfaces';
import { IToastView, ToastData } from '../../services/window/toast';
import { changeHtmlDirectionHelper } from '../../utils/locale';
import { getRendererInitialData, getToastWindowHandlers } from '../common/app-common';
import { RendererSuspenseFallback } from '../renderer-services/renderer-suspense-fallback';
import { toastContentRenderer } from '.';

import './toast-component.css';

interface ToastComponent {
	toast: ToastData;
	isRtl: boolean;
}

IpcServices.initializeRpc();

export default class ToastView extends Component implements IToastView {
	private ref: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
	private toastView = getRendererInitialData<ToastComponent>();
	private remoteServiceInstanceId: string = IpcServices.registerRemoteObject(this, 'tvd:toast-view');

	private registerDimensionsCalcView(): void {
		getToastWindowHandlers().registerDimensionsCalcView(this.remoteServiceInstanceId)
			.catch((error) => {
				loggerServiceProxy().error(
					`<ToastView>.registerDimensionsCalcView(): getToastWindowHandlers().registerDimensionsCalcView(remoteServiceInstanceId: ${ this.remoteServiceInstanceId })`,
					error,
				);
			});
	}

	override componentDidMount(): void {
		changeHtmlDirectionHelper(this.toastView.isRtl);
	}

	override componentWillUnmount(): void {
		IpcServices.unregisterRemoteObject(this.remoteServiceInstanceId);
	}

	override render(): JSX.Element {
		const toast = this.toastView.toast;

		const rendererData = {
			toastView: {
				toast,
			},
		};
		const renderer = toastContentRenderer.getRenderer(toast.rendererType);

		return (
			<div
				className="render-toast-container"
				ref={ this.ref }
			>
				<React.Suspense fallback={ <RendererSuspenseFallback onUnmount={ () => this.registerDimensionsCalcView() }/> }>
					{ renderer && renderer(rendererData) }
				</React.Suspense>
			</div>
		);
	}

	getToastViewDimensions(): Promise<Dimensions> {
		if (!this.ref.current) {
			return Promise.resolve({ width: 0, height: 0 });
		}

		const { width, height } = this.ref.current.getBoundingClientRect();

		return Promise.resolve({
			width: Math.ceil(width),
			height: Math.ceil(height),
		});
	}
}
