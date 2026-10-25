import { Subscription } from 'rxjs';

import { Promisify } from '../../ipc-remote';
import { MotionEventData, Point } from '../../native/hardware';
import { Disposable } from '../../tvd-runtime/core';
import { IMainService } from '../main-service/imain-service';

export class ScreenPointConverter implements Disposable {
	private isScaleDefault = true;
	private readonly scaleChangeSubscription: Subscription;

	constructor(private screen: Electron.Screen, mainService: IMainService | Promisify<IMainService>) {
		this.updateScaleStatus();

		this.scaleChangeSubscription = mainService.displayScaleChange.subscribe(display => {
			this.isScaleDefault = display.scaleFactor === 1;
		});
	}

	dispose(): void {
		this.scaleChangeSubscription.unsubscribe();
	}

	fromMotionEventToScreenPoint(data: MotionEventData): Point {
		let point = data.screenPoint;

		if (process.platform === 'linux') {
			point = this.formatPointIntoUbuntuFormat(data.screenPoint);
		}

		if (process.platform === 'win32') {
			point = this.screen.screenToDipPoint(data.screenPoint);
		}

		point.x = Math.floor(point.x);
		point.y = Math.floor(point.y);

		return point;
	}

	private updateScaleStatus(): void {
		this.isScaleDefault = !this.screen.getAllDisplays().some((display) => display.scaleFactor !== 1);
	}

	private formatPointIntoUbuntuFormat(point: Point): Point {
		if (this.isScaleDefault === true) {
			return point;
		}

		const formattedPoint = {
			x: point.x / 2,
			y: point.y / 2,
		};

		return formattedPoint;
	}
}
