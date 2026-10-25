import { Event, Input } from 'electron';

import { appEventService } from '../services/app-event-service';
import { hotkeyService } from '../utils/hotkey-service';
import { isDarwin } from './helpers';

export interface InputRule {
	keys: string[];
	shift?: boolean;
	control?: boolean;
	alt?: boolean;
	meta?: boolean;
}

export enum KeyboardEventKey {
	Enter = 'Enter',
	Space = 'Space',
	Tab = 'Tab',
	ArrowUp = 'ArrowUp',
	ArrowDown = 'ArrowDown',
	Escape = 'Escape',
}

const keysAsIs = [
	'Numpad0',
	'Numpad1',
	'Numpad2',
	'Numpad3',
	'Numpad4',
	'Numpad5',
	'Numpad6',
	'Numpad7',
	'Numpad8',
	'Numpad9',
	'Digit0',
	'Digit1',
	'Digit2',
	'Digit3',
	'Digit4',
	'Digit5',
	'Digit6',
	'Digit7',
	'Digit8',
	'Digit9',
	'NumpadSubtract',
	'Minus',
	'NumpadAdd',
	'Equal',
	'PageUp',
	'PageDown',
];

const fkeyRe = /f\d+/i;
const numpadDigitRegex = /^Numpad[0-9]/;
const charCodeRegex = /^[a-zA-Z]$/;

export function ruleMatchInput(rule: InputRule, input: Input): boolean {
	const [key] = rule.keys;

	if (key !== input.code) {
		return false;
	}

	if (input.shift !== Boolean(rule.shift)) {
		return false;
	}

	if (isDarwin()) {
		const isInputHasControlOrMetaKey = rule.meta ? input.meta : input.control || input.meta;
		const isRuleHasControlOrMetaKey = rule.meta ?? rule.control;

		if (Boolean(isRuleHasControlOrMetaKey) !== isInputHasControlOrMetaKey) {
			return false;
		}
	}
	else {
		if (input.control !== Boolean(rule.control)) {
			return false;
		}
	}

	if (input.alt !== Boolean(rule.alt)) {
		return false;
	}

	return true;
}

export function compareRules(rule1: InputRule, rule2: InputRule, input: Input): number {
	if (rule1.keys[0] !== rule2.keys[0]) {
		return 0;
	}

	const rule1HasShift = 'shift' in rule1;
	const rule2HasShift = 'shift' in rule2;

	const rule1HasCtrl = 'control' in rule1;
	const rule2HasCtrl = 'control' in rule2;

	const rule1HasAlt = 'alt' in rule1;
	const rule2HasAlt = 'alt' in rule2;

	if (input.shift && rule1HasShift !== rule2HasShift) {
		return rule1HasShift ? -1 : 1;
	}

	if (input.control && rule1HasCtrl !== rule2HasCtrl) {
		return rule1HasCtrl ? -1 : 1;
	}

	if (input.alt && rule1HasAlt !== rule2HasAlt) {
		return rule1HasAlt ? -1 : 1;
	}

	return 0;
}

export function parseRule(ruleString: string): InputRule {
	const keys = ruleString.split('+').map(k => k.trim());
	const rule: InputRule = {
		keys: [],
	};

	for (const k of keys) {
		if (k === 'shift') {
			rule.shift = true;
		}
		else if (k === 'ctrl') {
			rule.control = true;
		}
		else if (isDarwin() && k === 'cmd') {
			rule.meta = true;
		}
		else if (k === 'alt') {
			rule.alt = true;
		}
		else if (k === 'tab') {
			rule.keys.push('Tab');
		}
		else if (keysAsIs.includes(k)) {
			rule.keys.push(k);
		}
		else if (k === 'ArrowLeft') {
			rule.keys.push('ArrowLeft');
		}
		else if (k === 'ArrowRight') {
			rule.keys.push('ArrowRight');
		}
		else if (k === 'Comma') {
			rule.keys.push('Comma');
		}
		else if (fkeyRe.exec(k)) {
			rule.keys.push(k.toUpperCase());
		}
		else {
			rule.keys.push(`Key${ k.toUpperCase() }`);
		}
	}
	return rule;
}

export function adjustNumpadDigits(input: Input): Input {
	if (input.modifiers.includes('numlock') && numpadDigitRegex.exec(input.code)) {
		return { ...input, code: input.code.replace('Numpad', 'Digit') };
	}

	return input;
}

export function setKeyCodeUniversal(input: Input): Input {
	if (!charCodeRegex.exec(input.key)) {
		return input;
	}

	const modifiedInput = { ...input };
	modifiedInput.code = `Key${ input.key.toLocaleUpperCase() }`;

	return modifiedInput;
}

export class InputProcessor {
	private context: unknown;

	constructor(context: unknown) {
		this.context = context;
	}

	injectInput(ev: Event, input: Input): void {
		if (input.type !== 'keyDown' || appEventService().isClosing() || appEventService().isAutosaveInProgress()) {
			return;
		}

		// check the property to prevent multiple hotkey function invocation caused by sticky keys
		if (input.isAutoRepeat) {
			return;
		}

		const modifiedInput = setKeyCodeUniversal(input);

		hotkeyService().fireHotkey(modifiedInput, this.context);
	}
}
