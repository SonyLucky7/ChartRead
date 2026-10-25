import '@sentry/electron/preload';

import { DEFAULT_TVD_HOST, TARGET_TVD_HOST } from '../utils/tv-uri';

localStorage.setItem(TARGET_TVD_HOST, process.env[TARGET_TVD_HOST] ?? DEFAULT_TVD_HOST);
