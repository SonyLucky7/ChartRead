import { randomInt } from 'crypto';

export function generateRandomASCIIKey(length: number): string {
	if (length === 0) {
		return '';
	}

	const generatedInts: number[] = [];
	const encoder = new TextDecoder(); // utf-8

	for (let i = 0; i < length; i++) {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		generatedInts.push(randomInt(0, 127));
	}

	const buffer = new Uint8Array(generatedInts);
	return encoder.decode(buffer);
}
