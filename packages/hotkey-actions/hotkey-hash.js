import { isMac, isIOS } from '@tradingview/platform-features';
export const isMacKeyboard = isMac || isIOS;
/**
 * Modifiers for hotkey hashes.
 * Most hotkeys on Mac includes the ⌘Command key, while on Win/*nix Control is used.
 * The layout is determined in the runtime, so please do not hardcode the value and use these:
 * - Modifiers.Alt Alt / ⌥Option
 * - Modifiers.Shift ⇧Shift
 * - Modifiers.Mod Control on Windows, ⌘Command on Mac
 *
 * To construct a HotkeyHash just sum up all the modifiers and the keyCode:
 * Ctrl+Shift+A on Windows / Command+Shift+A on Mac:
 *      keys.Mod + keys.Shift + KeyboardEventKeyCode.KeyA
 * Win: 0b0000000101000001 (controlKey === true, keyCode === 65)
 * Mac: 0b0000100001000001 (metaKey === true, keyCode === 65)
 */
export var Modifiers;
(function (Modifiers) {
    Modifiers[Modifiers["None"] = 0] = "None";
    Modifiers[Modifiers["Alt"] = 512] = "Alt";
    Modifiers[Modifiers["Shift"] = 1024] = "Shift";
    /** Control on Win, Command on Mac */
    Modifiers[Modifiers["Mod"] = (isMacKeyboard ? 2048 /* Hardcode.Meta */ : 256 /* Hardcode.Control */)] = "Mod";
    /**
     * @deprecated
     * Control key on any platform. Use Mod instead!
     */
    Modifiers[Modifiers["Control"] = 256] = "Control";
    /**
     * @deprecated
     * Meta key on any platform. Use Mod instead!
     */
    Modifiers[Modifiers["Meta"] = 2048] = "Meta";
})(Modifiers || (Modifiers = {}));
/* Get the modifiers bitmask from an event */
export function modifiersFromEvent(e) {
    let modifiers = 0;
    if (e.shiftKey) {
        modifiers += 1024 /* Hardcode.Shift */;
    }
    if (e.altKey) {
        modifiers += 512 /* Hardcode.Alt */;
    }
    if (e.ctrlKey) {
        modifiers += 256 /* Hardcode.Control */;
    }
    if (e.metaKey) {
        modifiers += 2048 /* Hardcode.Meta */;
    }
    return modifiers;
}
/* Get the hotkeyHash from an event */
export function hashFromEvent(e) {
    // tslint:disable-next-line:deprecation
    return modifiersFromEvent(e) | e.keyCode;
}
export const hashShiftPlusEnter = 1024 /* Hardcode.Shift */ | 13 /* KeyboardEventKeyCode.Enter */;
/** Convert the modifiers bitmask into a human-readable string */
export function humanReadableModifiers(modifiers, plus = !isMacKeyboard) {
    let modifiersString = '';
    if (modifiers & 256 /* Hardcode.Control */) {
        modifiersString += appendModifierName(isMacKeyboard ? '\u005e' : 'Ctrl', plus);
    }
    if (modifiers & 512 /* Hardcode.Alt */) {
        modifiersString += appendModifierName(isMacKeyboard ? '\u2325' : 'Alt', plus);
    }
    if (modifiers & 1024 /* Hardcode.Shift */) {
        modifiersString += appendModifierName(isMacKeyboard ? '\u21e7' : 'Shift', plus);
    }
    if (modifiers & 2048 /* Hardcode.Meta */) {
        modifiersString += appendModifierName(isMacKeyboard ? '\u2318' : 'Win', plus);
    }
    return modifiersString;
}
const visualKeyNames = {
    0x09: '\u21e5', // Tab
    0x0D: '\u21b5', // Enter
    0x1B: 'Esc',
    0x08: isMacKeyboard ? '\u232b' : 'Backspace',
    0x20: 'Space',
    0x23: 'End',
    0x24: 'Home',
    0x25: '\u2190', // Arrow left
    0x26: '\u2191', // Arrow up
    0x27: '\u2192', // Arrow right
    0x28: '\u2193', // Arrow down
    0x2D: 'Ins',
    0x2E: 'Del',
    0xBC: ',',
    0xBF: '/',
};
/*
 * Valid names according to https://www.w3.org/TR/uievents-key/#keys-special
 */
const acessibleKeyNames = {
    0x09: 'Tab',
    0x0D: 'Enter',
    0x1B: 'Esc',
    0x08: 'Backspace',
    0x20: 'Space',
    0x23: 'End',
    0x24: 'Home',
    0x25: 'ArrowLeft',
    0x26: 'ArrowUp',
    0x27: 'ArrowRight',
    0x28: 'ArrowDown',
    0x2D: 'Ins',
    0x2E: 'Del',
    0xBC: ',',
    0xBF: '/',
};
// F1 .. F16
for (let fKey = 1; fKey <= 16; fKey++) {
    visualKeyNames[fKey + 111] = `F${fKey}`;
    acessibleKeyNames[fKey + 111] = `F${fKey}`;
}
export function humanReadableHash(hotkeyHash) {
    let hotkey = humanReadableModifiers(hotkeyHash);
    const keyCode = hotkeyHash & 255 /* Hardcode.KeyCode */;
    if (keyCode in visualKeyNames) {
        hotkey += visualKeyNames[keyCode];
    }
    else {
        hotkey += String.fromCharCode(keyCode);
    }
    return hotkey;
}
function appendModifierName(str, plus) {
    const appendString = plus ? ' + ' : (isMacKeyboard ? '\u0020' : '');
    return `${str}${appendString}`;
}
/*
 * Same as `humanReadableModifiers`,
 * but the resulting string is a valid `aria-keyshortcuts` value
 * according to https://www.w3.org/TR/wai-aria/#aria-keyshortcuts
 */
export function hotkeyHashToAriaKeyshortcuts(hotkeyHash) {
    const modifiersString = [];
    if (hotkeyHash & 256 /* Hardcode.Control */) {
        modifiersString.push('Ctrl');
    }
    if (hotkeyHash & 512 /* Hardcode.Alt */) {
        modifiersString.push('Alt');
    }
    if (hotkeyHash & 1024 /* Hardcode.Shift */) {
        modifiersString.push('Shift');
    }
    if (hotkeyHash & 2048 /* Hardcode.Meta */) {
        modifiersString.push('Meta');
    }
    const keyCode = hotkeyHash & 255 /* Hardcode.KeyCode */;
    if (keyCode in visualKeyNames) {
        modifiersString.push(visualKeyNames[keyCode]);
    }
    else {
        modifiersString.push(String.fromCharCode(keyCode));
    }
    return modifiersString.join('+');
}
