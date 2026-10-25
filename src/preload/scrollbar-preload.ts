import '@sentry/electron/preload';

import { styleScrollbars } from './scrollbars';
import { tvdObj } from './TVD';

styleScrollbars(tvdObj.getTheme, true);
