import { addBreadcrumb as addBreadcrumbSentry, captureMessage as captureMessageSentry, setTag as setTagSentry, SeverityLevel, withScope } from '@sentry/electron/renderer';
import { Event, Primitive } from '@sentry/types';

export interface SentryMessage {
	title: string;
	level: SeverityLevel;
	breadcrumbs: string[];
	code?: string;
}

export interface SentryBreadcrumb {
	breadcrumb: string;
	level: SeverityLevel;
}

export function addBreadcrumb(message: SentryBreadcrumb): void {
	addBreadcrumbSentry({
		category: 'message',
		message: message.breadcrumb,
		level: message.level,
	});
}

export function captureMessage(message: SentryMessage): void {
	withScope(scope => {
		scope.setLevel(message.level);

		if (message.code) {
			scope.setTag('message.code', message.code);
		}

		for (const breadcrumb of message.breadcrumbs) {
			scope.addBreadcrumb({
				category: 'message',
				message: breadcrumb,
				level: message.level,
			});
		}

		captureMessageSentry(message.title);
	});
}

export function setTag(tagName: string, value: string): void {
	setTagSentry(tagName, value);
}

export function getTag<T extends Primitive>(event: Event, key: string): T | undefined {
	const { tags } = event;
	if (!tags) {
		return;
	}

	const value = tags[key];

	if (!value) {
		return;
	}

	return value as T;
}
