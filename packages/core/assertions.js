"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNever = exports.ensure = exports.ensureNotNull = exports.ensureDefined = exports.assert = void 0;
/**
 * Checks an assertion. Throws if the assertion is failed.
 * @param condition Result of the assertion evaluation
 * @param message Text to include in the exception message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion failed".concat(message ? ": ".concat(message) : ''));
    }
}
exports.assert = assert;
function ensureDefined(value, valueName) {
    if (value === undefined) {
        throw new Error("".concat(valueName !== null && valueName !== void 0 ? valueName : 'Value', " is undefined"));
    }
    return value;
}
exports.ensureDefined = ensureDefined;
function ensureNotNull(value, valueName) {
    if (value === null) {
        throw new Error("".concat(valueName !== null && valueName !== void 0 ? valueName : 'Value', " is null"));
    }
    return value;
}
exports.ensureNotNull = ensureNotNull;
function ensure(value, valueName) {
    return ensureNotNull(ensureDefined(value, valueName), valueName);
}
exports.ensure = ensure;
/**
 * Compile time check for never
 */
function ensureNever(_value) {
    // do nothing
}
exports.ensureNever = ensureNever;
