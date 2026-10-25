import { getCurrentScope } from '@sentry/electron/main';
import { Integration } from '@sentry/types';

import { appRepositoryType } from '../../utils/application-repository-type';

export class RepositoryTypeIntegration implements Integration {
	static id = 'RepositoryTypeIntegration';
	readonly name = 'RepositoryTypeIntegration';

	setupOnce(): void {
		getCurrentScope().setTag('repository.type', appRepositoryType());
	}
}
