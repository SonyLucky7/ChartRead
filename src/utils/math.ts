export function fitInRange(value: number, maxValue: number, minValue: number): number {
	return Math.max(minValue, Math.min(maxValue, value));
}

export function clamp(value: number, minVal: number, maxVal: number): number {
	return Math.min(Math.max(value, minVal), maxVal);
}

export function randomIntFromInterval(min: number, max: number): number {
	const minInt = Math.ceil(min);
	const maxInt = Math.floor(max);
	return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
}
