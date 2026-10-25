import { DATA_IS_POPOVER_ITEM_BUTTON } from '@tradingview/ui-lib/popovers/attrs';

/**
 * Generates a data attribute for use in the PopoverKeyboardNavigator component.
 *
 * @param state - A boolean flag indicating whether the element should be marked
 * @returns An object containing the DATA_IS_POPOVER_ITEM_BUTTON key with a value
 *          of `true`, or `undefined` (if `state` is false)
 */
export const getArrowKeyboardNavigationDataAttributes = (state: boolean): { [DATA_IS_POPOVER_ITEM_BUTTON]: boolean | undefined; } => ({
	[DATA_IS_POPOVER_ITEM_BUTTON]: state || undefined,
});
