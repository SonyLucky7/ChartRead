export enum SaveChangesScopeType {
	Debug = 'debug',
	Chart = 'chart',
	Group = 'group',
	Window = 'window',
	App = 'app',
}

/**
 * Identifies the teardown flow a SaveChangesDialog belongs to. The error-state and decision
 * subjects are global (one exposed WindowService), so concurrent flows in different windows would
 * cross-trigger each other without the id: a per-window flow (window close, group switch-off)
 * scopes by the window's persistent id, while the single app-quit flow fans its dialogs out across
 * all windows under the shared APP_SAVE_SCOPE and intends every one of them to react together.
 */
export interface SaveChangesScope {
	type: SaveChangesScopeType;
	id: string;
}

export interface SaveChangesErrorState {
	scopeId: string;
	hasError: boolean;
}

/**
 * The user's choice in the SaveChangesDialog error state, shared by every teardown scope
 * (app quit, window close, tab group switch-off). String-valued because it crosses the
 * renderer <-> main IPC boundary and appears in logs.
 */
export enum SaveChangesDecisionType {
	Retry = 'retry',
	Discard = 'discard',
	Cancel = 'cancel',
}

export interface SaveChangesDecision {
	scopeId: string;
	type: SaveChangesDecisionType;
}

// the single app-quit flow shares one scope across every window's dialog (see SaveChangesScope)
export const APP_SAVE_SCOPE: SaveChangesScope = { type: SaveChangesScopeType.App, id: 'app' };
