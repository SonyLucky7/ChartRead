import { TabTitlePart, TabTitleState } from '../services/settings/tab-title-interfaces';
import { TabTitleView, TabTitleViewType } from '../services/window/window-api';
import { IAnimationData, IAnimationFrame, IAnimationPosition } from '../services/window/window-features/with-tooltips';
import { isChartUrl } from './tv-uri';

const visibleParts: TabTitlePart[] = ['ticker', 'lastPrice', 'priceChange'];
const layoutNamePart: TabTitlePart[] = ['layoutName'];

const hasVisibleText = (visible: TabTitlePart[], state: TabTitleState): boolean => visible.includes(state.id) && state.isVisible;

export function shouldShow(tooltipValue: TabTitleView, settings?: TabTitleState[], tabUrl?: string): boolean {
	const hasSomeVisibleTextPart = settings?.some(state => hasVisibleText([...visibleParts, ...layoutNamePart], state));
	const hasVisibleTextPartWithoutLayoutName = settings?.some(state => hasVisibleText(visibleParts, state));
	const hasVisibleTextPartLayoutName = settings?.some(state => hasVisibleText(layoutNamePart, state));

	const hasOnlyEmptyLayoutName = !hasVisibleTextPartWithoutLayoutName && hasVisibleTextPartLayoutName && tooltipValue.type === TabTitleViewType.Basic;
	const hasSomeVisibleTex = !hasSomeVisibleTextPart && typeof tooltipValue !== 'string';
	const isChart = tabUrl && isChartUrl(tabUrl);

	return !(hasOnlyEmptyLayoutName || hasSomeVisibleTex || !isChart);
}

const delta = (currentPosition: number, finalPosition: number): number => finalPosition - currentPosition;
const step = (positionDelta: number, stepsAmount: number): number => Math.floor(positionDelta / stepsAmount);

function animationPosition(frame: number, position: IAnimationPosition, stepsAmount: number): number {
	const positionDelta = delta(position.currentPosition, position.finalPosition);
	const frameDelta = step(positionDelta, stepsAmount);

	const nextPosition = frameDelta * (frame + 1);
	if (frame === stepsAmount - 1 || Math.abs(nextPosition) > Math.abs(positionDelta)) {
		return positionDelta;
	}
	return nextPosition;
}

export function* animationTooltip(animationData: IAnimationData): IterableIterator<IAnimationFrame> {
	for (let i = 0; i < animationData.stepsAmount; i++) {
		yield {
			position: animationPosition(i, animationData.position, animationData.stepsAmount),
		};
	}
}
