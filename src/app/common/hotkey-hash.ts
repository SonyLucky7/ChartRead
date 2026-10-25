import { isDarwin } from '../../utils';

/**
* enums from @tradingview/hotkey-actions/hotkey-hash
*/

/** Internal const enum. Use the exported Modifiers enum */
const enum HotkeyBits {
	KeyCode = 0xFF,
	Control = 0x100,
	Alt = 0x200,
	Shift = 0x400,
	Meta = 0x800,
}

/**
* Modifiers for hotkey hashes.
* Most hotkeys on Mac includes the Command key, while on Win/*nix Control is used.
* The layout is determined in the runtime, so please do not hardcode the value and use these:
* - Modifiers.Alt Alt / Option
* - Modifiers.Shift Shift
* - Modifiers.Mod Control on Windows, Command on Mac
*
* To construct a HotkeyHash just sum up all the modifiers and the keyCode:
* Ctrl+Shift+A on Windows / Command+Shift+A on Mac:
*      keys.Mod + keys.Shift + KeyboardEventKeyCode.KeyA
* Win: 0b0000000101000001 (controlKey === true, keyCode === 65)
* Mac: 0b0000100001000001 (metaKey === true, keyCode === 65)
*/

export enum HotkeyModifiers {
	None = 0,
	Alt = HotkeyBits.Alt,
	Shift = HotkeyBits.Shift,
	/** Control on Win, Command on Mac */
	CtrlOrCmd = isDarwin() ? HotkeyBits.Meta : HotkeyBits.Control,
}
