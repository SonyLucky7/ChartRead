import { webFrame } from 'electron';
import '@sentry/electron/preload';

interface IStyleManager {
	key: string;
	applyRules(overrideRules?: string): void;
	removeRules(): void;
}

export class StyleManager implements IStyleManager {
	constructor(public key: string, private rules?: string) { }

	applyRules(overrideRules?: string | undefined): void {
		const rulesToApply = overrideRules ?? this.rules;

		if (!rulesToApply) {
			return;
		}

		const existingKey = localStorage.getItem(this.key);

		if (existingKey) {
			webFrame.removeInsertedCSS(existingKey);
		}

		const insertedCssId = webFrame.insertCSS(rulesToApply);

		localStorage.setItem(this.key, insertedCssId);
	}

	removeRules(): void {
		const existingKey = localStorage.getItem(this.key);

		if (existingKey) {
			webFrame.removeInsertedCSS(existingKey);
		}
	}
}
