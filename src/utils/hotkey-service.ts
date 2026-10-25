import { Input } from 'electron';

import { loggerService } from '../logger';
import { mainMenuService } from '../services/main-menu-service';
import { TabbedWindow } from '../services/window/tabbed-window-imports';
import { adjustNumpadDigits, compareRules, InputRule, parseRule, ruleMatchInput } from '../utils/input-processor';
import { isDarwin } from '.';

export type Command = 'zoom-in' | 'zoom-out' | 'set-zoom-default' |
	'new-window' | 'new-tab' | 'duplicate-tab' | 'reopen-tab' | 'reload-tab' | 'reload-tab-no-darwin' | 'close-tab' |
	'prev-tab' | 'prev-tab-darwin' | 'next-tab' | 'next-tab-darwin' | 'set-last-tab' |
	'exit' | 'exit-darwin' | 'save-snapshot' | 'set-specific-tab' | 'set-full-screen' | 'open-help-center' |
	'show-wnd-dev-tools' | 'show-tab-dev-tools' | 'show-settings';

const hotkeys = new Map<string, Command>([
	['ctrl+Equal', 'zoom-in'],
	['ctrl+NumpadAdd', 'zoom-in'],
	['ctrl+Minus', 'zoom-out'],
	['ctrl+NumpadSubtract', 'zoom-out'],
	['ctrl+Numpad0', 'set-zoom-default'],
	['ctrl+Digit0', 'set-zoom-default'],
	[isDarwin() ? 'cmd+n' : 'ctrl+n', 'new-window'],
	['ctrl+PageDown', 'next-tab'],
	['ctrl+Numpad3', 'next-tab'],
	['ctrl+alt+ArrowRight', 'next-tab-darwin'],
	['ctrl+tab', 'next-tab'],
	['ctrl+PageUp', 'prev-tab'],
	['ctrl+Numpad9', 'prev-tab'],
	['ctrl+shift+tab', 'prev-tab'],
	['ctrl+alt+ArrowLeft', 'prev-tab-darwin'],
	[isDarwin() ? 'cmd+t' : 'ctrl+t', 'new-tab'],
	['ctrl+Digit1', 'set-specific-tab'],
	['ctrl+Digit2', 'set-specific-tab'],
	['ctrl+Digit3', 'set-specific-tab'],
	['ctrl+Digit4', 'set-specific-tab'],
	['ctrl+Digit5', 'set-specific-tab'],
	['ctrl+Digit6', 'set-specific-tab'],
	['ctrl+Digit7', 'set-specific-tab'],
	['ctrl+Digit8', 'set-specific-tab'],
	['ctrl+Digit9', 'set-last-tab'],
	['ctrl+shift+t', 'reopen-tab'],
	['ctrl+f4', 'close-tab'],
	['ctrl+w', 'close-tab'],
	['ctrl+shift+q', 'exit'],
	['ctrl+q', 'exit-darwin'],
	['ctrl+r', 'reload-tab'],
	['ctrl+u', 'duplicate-tab'],
	['ctrl+s', 'save-snapshot'],
	['ctrl+shift+f12', 'show-wnd-dev-tools'],
	['ctrl+shift+f11', 'show-tab-dev-tools'],
	['f1', 'open-help-center'],
	['f5', 'reload-tab-no-darwin'],
	['f11', 'set-full-screen'],
	['ctrl+Comma', 'show-settings'],
]);

type HotkeyCallback = (this: any, ...args: any[]) => any;
type AnyMethodDescriptor = (target: unknown, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<HotkeyCallback>) => TypedPropertyDescriptor<HotkeyCallback> | undefined;
type HotkeyPredicate = () => boolean;

export interface HotkeyOption {
	sendKey?: boolean;
	pred?: HotkeyPredicate;
}

export interface IHotkeyService {
	registerHandler(command: string, contextPrototype: unknown, cb: HotkeyCallback, options?: HotkeyOption): void;
	fireHotkey(hotkey: Input, thisContext: unknown): void;
}

interface CommandBinding {
	callback: HotkeyCallback;
	commandName: string;
	contextPrototype: unknown;
	options?: HotkeyOption;
}

interface HotkeyBinding {
	hotkey: InputRule;
	commandName: string;
}

const isTabbedWindow = (obj: any): obj is TabbedWindow => {
	return typeof obj === 'object' && 'lastMouseCoordinates' in obj;
};

export function bindHotkeyCommand(commandName: Command, options?: HotkeyOption): AnyMethodDescriptor {
	return (target: unknown, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<HotkeyCallback>) => {
		if (descriptor.value) {
			const method = descriptor.value;

			descriptor.value = function(...args: any[]): unknown {
				if (isTabbedWindow(this)) {
					this.hideTabMenu();
				}

				mainMenuService().hideMenu(true);
				return method.apply(this, args) as unknown;
			};

			Reflect.defineMetadata(getMetadataKey(commandName), propertyKey, target as Record<string, unknown>);

			hotkeyService().registerHandler(commandName, target, descriptor.value, options);
		}

		return descriptor;
	};
}

function getMetadataKey(commandName: string): string {
	const HOTKEY_ASSIGNED_KEY = 'hotkey-assigned';

	return `${ HOTKEY_ASSIGNED_KEY }:${ commandName }`;
}

function inputToString(input: Input): string {
	let str = input.code;
	if (input.alt) {
		str = `alt+${ str }`;
	}
	if (input.control) {
		str = `ctrl+${ str }`;
	}
	if (input.shift) {
		str = `shift+${ str }`;
	}
	if (input.meta) {
		if (isDarwin()) {
			str = `cmd+${ str }`;
		}
	}

	return str;
}

class HotkeyService implements IHotkeyService {
	private readonly commandBindings: CommandBinding[] = [];
	private readonly hotkeyBindings: HotkeyBinding[] = [];

	constructor() {
		hotkeys.forEach((value, key) => {
			this.hotkeyBindings.push({ hotkey: parseRule(key), commandName: value });
		});
	}

	registerHandler(command: string, context: unknown, cb: HotkeyCallback, options?: HotkeyOption): void {
		this.commandBindings.push({ commandName: command, contextPrototype: context, options, callback: cb });
	}

	fireHotkey(hotkey: Input, thisContext: unknown): void {
		hotkey = adjustNumpadDigits(hotkey);

		const matchedBindings = this.hotkeyBindings
			.filter(a => ruleMatchInput(a.hotkey, hotkey))
			.sort((a, b) => compareRules(a.hotkey, b.hotkey, hotkey));

		if (matchedBindings.length === 0) {
			return;
		}

		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line array-callback-return
		const command = this.commandBindings.find(value => {
			if (
				value.commandName === matchedBindings[0].commandName &&
				Object.prototype.isPrototypeOf.call(value.contextPrototype, thisContext as object)
			) {
				return value;
			}
		});

		if (!command) {
			return;
		}

		if (command.options?.pred && !command.options?.pred()) {
			return;
		}

		if (!this.isHotkeyAssigned(command.commandName, thisContext)) {
			return;
		}

		loggerService().info(`Invoke key binding [${ inputToString(hotkey) }]`);

		const args: any[] = command.options?.sendKey ? [hotkey.key] : [];

		command.callback.apply(thisContext, args);

		if (isTabbedWindow(thisContext)) {
			thisContext.triggerMenuCloseEvent('hotkey-fired');
		}
	}

	private isHotkeyAssigned(commandName: string, obj: unknown): boolean {
		return Reflect.hasMetadata(getMetadataKey(commandName), obj as object);
	}
}

let hkService_: HotkeyService | undefined;

export function hotkeyService(): IHotkeyService {
	if (!hkService_) {
		hkService_ = new HotkeyService();
	}

	return hkService_;
}
