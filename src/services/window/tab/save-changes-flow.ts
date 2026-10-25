import { Observable, Subscription } from 'rxjs';

import { loggerService } from '../../../logger';
import { SaveChangesDecision, SaveChangesDecisionType, SaveChangesScopeType } from './save-changes-types';
import { saveCharts } from './shutdown-checks';
import { TvTab } from './tv-tab';

/**
 * Shared orchestrator for the unified tabs shutdown flow (app quit, window close, tab group
 * switch-off). It runs the single "show saving dialog -> save -> on failure show the error state ->
 * await the user's decision -> retry / discard / cancel" loop, parameterized by scope-specific
 * callbacks. The detection/collection of unsaved charts is the caller's responsibility (see
 * shutdown-checks.ts); this module only drives the dialog + save + retry loop.
 */

export interface SaveChangesFlowOptions {
	chartTabs: Iterable<TvTab>;
	scopeType: SaveChangesScopeType;
	showDialog(): Promise<void>;
	closeDialog(): void;
	setError(hasError: boolean): void;
	awaitSaveChangesDecision(): Promise<SaveChangesDecisionType>;
}

export const enum SaveChangesFlowResult {
	// every unsaved chart was saved (possibly after one or more retries)
	Saved = 'saved',
	// the user chose to proceed without saving ("Quit anyway" / "Close anyway")
	Discarded = 'discarded',
	// the user aborted, or the flow itself failed (see the catch in runSaveChangesFlow);
	// either way the caller must NOT tear down (window stays open, group stays active, ...)
	Cancelled = 'cancelled',
	// autosave is not applicable; the caller must fall back to asking the user per tab.
	Skipped = 'skipped',
}

/**
 * Drives the save-with-dialog retry loop. Closes the dialog on every terminal path (including
 * when awaitSaveChangesDecision rejects), which is what lets window-close retry safely and never leaves a
 * dangling saving dialog.
 */
export async function runSaveChangesFlow(options: SaveChangesFlowOptions): Promise<SaveChangesFlowResult> {
	const { chartTabs, scopeType, showDialog, closeDialog, setError, awaitSaveChangesDecision } = options;

	/**
	 * materialize once: the retry loop saves the same charts repeatedly, but a one-shot
	 * iterable (e.g. Map.values()) would be exhausted after the first attempt
	 */
	const chartTabList = [...chartTabs];

	let step = 'showDialog';

	try {
		await showDialog();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			step = 'saveCharts';
			const saveResponses = await saveCharts(chartTabList, scopeType);
			const someFailed = saveResponses.some((response) => !response.success);

			if (!someFailed) {
				return SaveChangesFlowResult.Saved;
			}

			setError(true);

			step = 'awaitSaveChangesDecision';
			const decision = await awaitSaveChangesDecision();

			if (decision === SaveChangesDecisionType.Discard) {
				return SaveChangesFlowResult.Discarded;
			}

			if (decision === SaveChangesDecisionType.Cancel) {
				return SaveChangesFlowResult.Cancelled;
			}

			// SaveChangesDecisionType.Retry: clear the error state and save again
			setError(false);
		}
	}
	catch (error) {
		loggerService().error(`runSaveChangesFlow: '${ step }' failed, cancelling the flow`, error);
		return SaveChangesFlowResult.Cancelled;
	}
	finally {
		closeDialog();
	}
}

/**
 * Resolves with the next decision emitted for the given scope, then tears down the subscription.
 * Decisions tagged with a different scope are ignored, so a concurrent flow in another window can't resolve this one.
 */
export async function awaitSaveChangesDecisionOnce(
	saveChangesDecision: Observable<SaveChangesDecision>,
	scopeId: string,
): Promise<SaveChangesDecisionType> {
	let subscription!: Subscription;
	try {
		return await new Promise<SaveChangesDecisionType>((resolve) => {
			subscription = saveChangesDecision.subscribe((event) => {
				if (event.scopeId === scopeId) {
					resolve(event.type);
				}
			});
		});
	}
	finally {
		subscription.unsubscribe();
	}
}
