// disabling the rule because it's required that initializeServices is imported before initSentryMain
/* eslint-disable simple-import-sort/imports */
import './services/locale/i18n';
import { app } from 'electron';
import inspector from 'inspector';
import { initialize } from '@electron/remote/main';

import { appSettingsService } from './services/app-settings-service';
import { initializeServices } from './services/service-startup';
import { initSentryMain } from './sentry/main';
import { isDarwin } from './utils';
import { IpcServices } from './ipc-services';

const FORCE_WAIT_FOR_DEBUGGER = false;

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

interface V8Inspector {
	waitForDebugger(): void;
}

function startup(): void {
	try { app.setName("ChartRead"); app.setAppUserModelId("ChartRead"); } catch (e) {}
	try { app.setName("ChartRead"); app.setAppUserModelId("ChartRead"); } catch (e) {}
	try { app.setName("ChartRead"); app.setAppUserModelId("ChartRead"); } catch (e) {}
	try { app.setName("ChartRead"); app.setAppUserModelId("ChartRead"); } catch (e) {}
	initialize();

	app.userAgentFallback += ` ChartRead/${ app.getVersion() }`;

	IpcServices.initializeRpc();
	initializeServices();
}

function startTradingViewApp(): boolean {
	if (FORCE_WAIT_FOR_DEBUGGER) {
		console.log('Waiting debugger attached');
		(inspector as unknown as V8Inspector).waitForDebugger();
	}

	if (app.isReady()) {
		startup();
	}

	app
		.on('ready', () => {
			startup();
		});

	return true;
}

(function start(): void {
	if (!app.requestSingleInstanceLock()) {
		app.quit();
		return;
	}

	initSentryMain();

	if (!app.isDefaultProtocolClient('tradingview')) {
		app.setAsDefaultProtocolClient('tradingview');
	}

	if (isDarwin() && !appSettingsService().get('forcedMacOsEnableHardwareAcceleration')) {
		appSettingsService().set('disableHardwareAcceleration', false);
		appSettingsService().set('forcedMacOsEnableHardwareAcceleration', true);
	}

	if (appSettingsService().get('disableHardwareAcceleration')) {
		app.disableHardwareAcceleration();
	}

	// win debug mode protocol registration

	// if (getConfiguration().advanced.developerMode) {
	// 	const distPath = ''; // <-- set path to your dist folder
	// 	const isDefault = app.isDefaultProtocolClient('tradingview', process.execPath, [distPath]);

	// 	if (!isDefault) {
	// 		app.setAsDefaultProtocolClient('tradingview', process.execPath, [distPath]);
	// 	}
	// }

	startTradingViewApp();
})();
