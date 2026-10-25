import { clipboard, nativeImage } from 'electron';
import { IncomingMessage } from 'http';
import * as https from 'https';

import { loggerService } from '../logger';
import { getMessageOfError } from '../tvd-runtime/core';

function httpsGetAsync(url: string): Promise<IncomingMessage> {
	return new Promise<IncomingMessage>((resolve, reject) => {
		https
			.get(url, resolve)
			.once('error', reject);
	});
}

async function httpsGetResource(url: string): Promise<Buffer> {
	const stream = await httpsGetAsync(url);
	const chunks: Uint8Array[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Uint8Array);
	}

	return Buffer.concat(chunks);
}

export async function copyImageToClipboard(url: string): Promise<void> {
	try {
		const buffer = await httpsGetResource(url);
		const img = nativeImage.createFromBuffer(buffer);
		clipboard.writeImage(img);
	}
	catch (error) {
		const message = getMessageOfError(error);
		loggerService().error(`Image download error (${ url }): ${ message }`, error);
	}
}
