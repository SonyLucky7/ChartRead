import { clamp } from './math';
export interface Position {
	x: number;
	y: number;
}

export interface Rectangle extends Position {
	width: number;
	height: number;
}

export function centeredRect(parentRect: Rectangle, targetWidth: number, targetHeight: number): Rectangle {
	const parentCenter: Position = {
		x: parentRect.x + parentRect.width / 2,
		y: parentRect.y + parentRect.height / 2,
	};

	return {
		x: Math.floor(parentCenter.x - targetWidth / 2),
		y: Math.floor(parentCenter.y - targetHeight / 2),
		width: targetWidth,
		height: targetHeight,
	};
}

export const isInBounds = (rect: Rectangle, point: Position, delta = 0): boolean => {
	if (rect.x - delta <= point.x && rect.x + delta + rect.width > point.x &&
		rect.y - delta <= point.y && rect.y + delta + rect.height > point.y) {
		return true;
	}
	return false;
};

export function areEqual(point1: Position, point2: Position, delta: number): boolean {
	return point1.x >= point2.x - delta && point1.x <= point2.x + delta &&
		(point1.y >= point2.y - delta && point1.y <= point2.y + delta);
}

export function getWindowRelativePoint(point: Position, windowBounds: Rectangle): Position {
	const relativePoint: Position = {
		x: point.x - windowBounds.x,
		y: point.y - windowBounds.y,
	};

	return relativePoint;
}

/**
 * 1st clamp size to workArea, 2nd move position if necessary.
 * If minWidth and minHeight larger then workArea resulting bounds === workArea
 * @param bounds desired bounds
 * @param minWidth
 * @param minHeight
 * @param workArea area to confine to, workArea.width and height are absolute
 * @returns bounds fully contained in workArea
 */
export function confineBounds(bounds: Rectangle, minWidth: number, minHeight: number, workArea: Rectangle): Rectangle {
	const width = clamp(bounds.width, minWidth, workArea.width);
	const height = clamp(bounds.height, minHeight, workArea.height);

	let x = clamp(bounds.x, workArea.x, workArea.width + workArea.x);
	let y = clamp(bounds.y, workArea.y, workArea.height + workArea.y);

	const xOffset = workArea.width + workArea.x - (x + width);
	const yOffset = workArea.height + workArea.y - (y + height);

	if (xOffset < 0) {
		x += xOffset;
	}
	if (yOffset < 0) {
		y += yOffset;
	}

	return { width, height, x, y };
}
