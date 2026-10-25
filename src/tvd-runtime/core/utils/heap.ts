// tslint:disable: no-magic-numbers

const heapParentIdx = (i: number): number => Math.floor((i - 1) / 2);

type OrderingPredicate<T> = (compared: T, value: T) => boolean;

function heapifyAt<T>(heap: T[], i: number, N: number, reorder: OrderingPredicate<T>): void {
	const left = i * 2 + 1;
	const right = i * 2 + 2;
	let winner = i;

	if (left < N && reorder(heap[left], heap[i])) { // heap[left] > heap[i]
		winner = left;
	}

	if (right < N && reorder(heap[right], heap[winner])) {
		winner = right;
	}

	if (winner !== i) {
		const temp = heap[i];
		heap[i] = heap[winner];
		heap[winner] = temp;

		heapifyAt(heap, winner, N, reorder);
	}
}

function heapify<T>(heap: T[], reorder: OrderingPredicate<T>): void {
	const N = heap.length;
	if (N < 2) {
		return;
	}

	for (let i = Math.floor(N / 2) - 1; i >= 0; --i) {
		heapifyAt(heap, i, N, reorder);
	}
}

function heapPush<T>(heap: T[], value: T, reorder: OrderingPredicate<T>): void {
	const current = heap.push(value) - 1;
	let parent = heapParentIdx(current);

	while (parent >= 0) {
		heapifyAt(heap, parent, heap.length, reorder);
		parent = heapParentIdx(parent);
	}
}

function heapPop<T>(heap: T[], reorder: OrderingPredicate<T>): T | undefined {
	if (heap.length === 0) {
		return undefined;
	}

	if (heap.length === 1) {
		return heap.pop();
	}

	const value = heap[0];
	heap[0] = heap.splice(heap.length - 1, 1)[0];
	heapifyAt(heap, 0, heap.length, reorder);
	return value;
}

export type Compare<T> = (left: T, right: T) => number;

export interface Heap<T> {
	readonly top: T | undefined;

	heapify(): T[];
	push(value: T): void;
	pop(): T | undefined;
}

function makeHeap<T>(arr: T[], ordering: OrderingPredicate<T>): Heap<T> {
	const heap: Heap<T> = {
		get top(): T | undefined {
			return arr.length >= 0 ? arr[0] : undefined;
		},

		heapify() {
			heapify(arr, ordering);
			return arr;
		},

		push(value: T): void {
			heapPush(arr, value, ordering);
		},

		pop(): T | undefined {
			return heapPop(arr, ordering);
		},
	};

	heap.heapify();
	return heap;
}

export function minHeap<T>(arr: T[], cmp?: Compare<T>): Heap<T> {
	let ordering: OrderingPredicate<T>;

	if (typeof cmp === 'function') {
		ordering = (compared: T, value: T): boolean => {
			return cmp(compared, value) < 0;
		};
	}
	else {
		ordering = (compared: T, value: T): boolean => {
			return compared < value;
		};
	}

	return makeHeap(arr, ordering);
}

export function maxHeap<T>(arr: T[], cmp?: Compare<T>): Heap<T> {
	let ordering: OrderingPredicate<T>;

	if (typeof cmp === 'function') {
		ordering = (compared: T, value: T): boolean => {
			return cmp(compared, value) >= 0;
		};
	}
	else {
		ordering = (compared: T, value: T): boolean => {
			return compared >= value;
		};
	}

	return makeHeap(arr, ordering);
}
