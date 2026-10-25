// eslint-disable-next-line no-restricted-syntax
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
const touchevents = isBrowser && ('ontouchstart' in window);
/** This page is shown on a mobile touch device */
export const mobiletouch = isBrowser && (touchevents && 'onorientationchange' in window);
export const touch = isBrowser && (touchevents || !!navigator.maxTouchPoints);
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// tslint:disable-next-line:no-any
export const isChrome = isBrowser && window.chrome && window.chrome.runtime;
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
export const isFF = isBrowser && window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
export const isEdge = isBrowser && /\sEdge\/\d\d\b/.test(navigator.userAgent);
/* eslint-disable deprecation/deprecation */
export const isSafari = isBrowser && Boolean(navigator.vendor) && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1;
/* eslint-disable deprecation/deprecation */
export const isMac = isBrowser && /mac/i.test(navigator.platform);
export const isWindows = isBrowser && /Win32|Win64/i.test(navigator.platform);
export const isLinux = isBrowser && /Linux/i.test(navigator.platform);
export const isAndroid = isBrowser && /Android/i.test(navigator.userAgent);
export const isBlackBerry = isBrowser && /BlackBerry/i.test(navigator.userAgent);
export const isIOS = isBrowser && /iPhone|iPad|iPod/.test(navigator.platform);
export const isOperaMini = isBrowser && /Opera Mini/i.test(navigator.userAgent);
export const isIPad = isBrowser && ((navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /iPad/.test(navigator.platform));
export const isAnyMobile = isAndroid || isBlackBerry || isIOS || isOperaMini;
/* eslint-enable deprecation/deprecation */
