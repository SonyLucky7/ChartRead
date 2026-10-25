import i18next, { TFunction } from 'i18next';
import React from 'react';
import { BehaviorSubject, Subject } from 'rxjs';

import { WindowState } from '../../services/window/window-api';
import { Position } from '../../utils';

export interface Action<Type, Payload> {
	type: Type;
	payload: Payload;
}

export interface WindowEvents {
	windowStateSubject: BehaviorSubject<WindowState>;
	hoverCheckSubject: Subject<Position>;
	windowResizeSubject: Subject<number>;
	windowFocused: boolean;
	windowId: string;
	isRtlSystem: boolean;
}

export const WindowEventsContext =
	React.createContext<WindowEvents>({
		windowStateSubject: new BehaviorSubject<WindowState>(WindowState.Normal),
		windowResizeSubject: new Subject<number>(),
		hoverCheckSubject: new Subject<Position>(),
		windowFocused: false,
		windowId: '',
		isRtlSystem: false,
	});

export interface Translation {
	t: TFunction<string>;
}

export const TranslationContext =
	React.createContext<Translation>({
		t: i18next.t,
	});
