import { webFrame } from 'electron';
import '@sentry/electron/preload';

function change2FAWindowBackgroundColor(): void {
	const color = 'var(--color-background-tertiary-inverse)';

	const styles = `
		html.theme-dark body {
			background-color: ${ color } !important;
		}

		html.theme-dark #tv-two-factor-social-signin, html.theme-dark .tv-two-factor-social-signin {
			background-color: ${ color } !important;
		}

		html body {
			overflow: hidden
		}
	`;

	webFrame.insertCSS(styles);
}

change2FAWindowBackgroundColor();
