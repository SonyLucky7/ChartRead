import { app, ipcMain } from 'electron';
import { EventHint, init as initSentry, IPCMode } from '@sentry/electron/main';
import { Attachment, ErrorEvent } from '@sentry/types';

import { setupFailFast } from '../assertion';
import { getConfiguration } from '../services/configuration';
import { isDevPackage } from '../services/dev-package';
import { IReportsService } from '../services/interfaces';
import { SEND_TO_SENTRY_BREADCRUMB } from '../tv-api/tvd-channels';
import { captureAssert } from './capture-assert';
import { handleEvent } from './custom-event-handler';
import { registeredEffects } from './effects';
import { CustomEventIntegration } from './integrations/custom-event-integration';
import { LoggerIntegration } from './integrations/logger-integration';
import { RepositoryTypeIntegration } from './integrations/repository-type-integration';
import { addBreadcrumb, SentryBreadcrumb } from './message-utils';
import { allowedUsers, UserType } from './user-context';

const isMainProcess = typeof ipcMain !== 'undefined';

const devEnvironment = 'development';
const prodEnvironment = 'production';

export function initSentryMain(): void {
	if (!isMainProcess) {
		throw new Error('This initialization must be called from main process');
	}

	try {
		initSentry({
			environment: isDevPackage() ? devEnvironment : prodEnvironment,
			dsn: getConfiguration().sentry.dsn,
			beforeSend: beforeSendHandler,
			release: app.getVersion(),
			integrations: (defaults) => {
				const defaultsWithoutPreloadInjection = defaults.filter((i) => i.name !== 'PreloadInjection');

				return [
					...defaultsWithoutPreloadInjection,
					new RepositoryTypeIntegration(),
					new LoggerIntegration(),
					new CustomEventIntegration(),
				];
			},
			ipcMode: IPCMode.Classic,
		});

		ipcMain.handle(SEND_TO_SENTRY_BREADCRUMB, (ev, breadcrumb: SentryBreadcrumb) => {
			addBreadcrumb(breadcrumb);
		});

		setupFailFast(captureAssert);
	}
	catch (err) {
		console.error(err);
	}
}

async function beforeSendHandler(event: ErrorEvent, hint: EventHint): Promise<ErrorEvent | null> {
	// it's safe to mutate parameters here, because it will be removed after sending
	runEffects();
	if (!handleEvent(event)) {
		return null;
	}

	if (!getConfiguration().sentry.upload) {
		return null;
	}

	if (!isUserAllowed(event)) {
		return null;
	}

	try {
		const attachments = await collectAttachments();
		hint.attachments?.push(attachments);
	}
	catch (err) {
		addBreadcrumb({
			breadcrumb: `An error during attachments collecting - ${ err }`,
			level: 'error',
		});
	}

	return event;
}

function isUserAllowed(event: ErrorEvent): boolean {
	if (isDevPackage()) {
		return true;
	}

	if (event.contexts?.user) {
		const userType = event.contexts.user.userType as UserType;

		return allowedUsers.includes(userType);
	}

	return false;
}

function runEffects(): void {
	registeredEffects.forEach((effect) => {
		try {
			effect();
		}
		catch (error) {
			addBreadcrumb({
				breadcrumb: `An error during running unconditional effects happened - ${ error }`,
				level: 'error',
			});
		}
	});
}

async function collectAttachments(): Promise<Attachment> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const reportsService = require('../services/reports-service').default as () => IReportsService;
	const reports = await reportsService().getSentryAttachmentsZip();

	return {
		filename: 'reports.zip',
		data: reports,
		contentType: 'application/zip',
	};
}
