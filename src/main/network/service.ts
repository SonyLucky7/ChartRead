import { app, Session, session } from 'electron';
import { BehaviorSubject, Subscription } from 'rxjs';

import { get, HttpResponseCode } from '../../http';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { appEventService } from '../../services/app-event-service';
import { appSettingsService } from '../../services/app-settings-service';
import { passwordManagerService } from '../../services/password-manager';
import { Disposable } from '../../tvd-runtime/core';
import { NETWORK_SERVICE_CONTRACT } from '../network';
import { MainNetworkService } from './interfaces';
import { PROXY_SERVICE_ACCOUNT_NAME, PROXY_SERVICE_NAME, PROXY_SERVICE_PASSWORD_NAME } from './proxy-credentials';
import { ProxyProtocol } from './proxy-protocol';

const PING_URL = 'https://data.tradingview.com/ping';
const PING_TIMEOUT = 1_000;

const DEFAULT_PROXY_PORTS = new Map<ProxyProtocol, string>([
	[ProxyProtocol.Http, '80'],
	// TODO: uncomment when connection using https is fixed
	// [ProxyProtocol.Https, '443'],
	[ProxyProtocol.Socks5, '1080'],
]);

const MIN_PROXY_PORT = 1;
const MAX_PROXY_PORT = 65535;

function isValidNetworkPort(port: string): boolean {
	if (!/^\d+$/.test(port)) {
		return false;
	}

	const portNumber = Number.parseInt(port, 10);
	return portNumber >= MIN_PROXY_PORT && portNumber <= MAX_PROXY_PORT;
}

@ExposeSingletonService(NETWORK_SERVICE_CONTRACT, IpcServices.getProvider())
@logCallName('NetworkService')
export class NetworkService implements MainNetworkService, Disposable {
	private readonly networkStatusSubject = new BehaviorSubject<boolean>(true);
	public readonly networkStatusChange = this.networkStatusSubject.asObservable();

	// enabled
	private readonly proxyEnabledSubject = new BehaviorSubject<boolean>(appSettingsService().get('isProxyEnabled'));
	public readonly proxyEnabledChange = this.proxyEnabledSubject.asObservable();
	// protocol
	private readonly proxyProtocolSubject = new BehaviorSubject<ProxyProtocol>(appSettingsService().get('proxyProtocol'));
	public readonly proxyProtocolChange = this.proxyProtocolSubject.asObservable();
	// ip address
	private readonly proxyIpAddressSubject = new BehaviorSubject<string>(appSettingsService().get('proxyServerIpAddress'));
	public readonly proxyIpAddressChange = this.proxyIpAddressSubject.asObservable();
	// port
	private readonly proxyPortSubject = new BehaviorSubject<string>(appSettingsService().get('proxyServerPort'));
	public readonly proxyPortChange = this.proxyPortSubject.asObservable();

	private readonly subscriptions: Subscription[] = [];
	private readonly pingIntervalId: NodeJS.Timeout;

	constructor() {
		loggerService().debug('Initializing NetworkService');

		this.subscribeAll();

		const pingCheckInterval = 10_000;
		this.pingIntervalId = setInterval(() => {
			this.ping()
				.then((value) => {
					if (value !== this.networkStatusSubject.value) {
						this.networkStatusSubject.next(value);
					}

					if (!value) {
						loggerService().warn(`NetworkService: failed request to ${ PING_URL }`);
					}
				})
				.catch((error) => {
					loggerService().error('NetworkService: ping error', error);
				});
		}, pingCheckInterval);
	}

	public dispose(): void {
		clearInterval(this.pingIntervalId);
		this.subscriptions.forEach((subscription) => subscription.unsubscribe());
		this.networkStatusSubject.complete();
		this.proxyEnabledSubject.complete();
		this.proxyProtocolSubject.complete();
		this.proxyIpAddressSubject.complete();
		this.proxyPortSubject.complete();
	}

	@logCall
	public resetProxySettings(): void {
		this.proxyEnabledSubject.next(false);
		this.proxyProtocolSubject.next(ProxyProtocol.Http);
		this.proxyIpAddressSubject.next('');
		this.proxyPortSubject.next('');

		/**
		 * passwordManagerService().deletePassword() is called twice below because account and password
		 * are stored separately as key: value pair, i.e. key: account, key: password. this is required
		 * because keytar cannot store key: value pair with empty or without value (a proxy may be used
		 * without password)
		 */
		passwordManagerService().deletePassword(PROXY_SERVICE_ACCOUNT_NAME, PROXY_SERVICE_NAME);
		passwordManagerService().deletePassword(PROXY_SERVICE_PASSWORD_NAME, PROXY_SERVICE_NAME);
	}

	public proxyEnabled(): boolean {
		return this.proxyEnabledSubject.value;
	}

	public setProxyEnabled(value: boolean): void {
		this.proxyEnabledSubject.next(value);
	}

	public proxyProtocol(): ProxyProtocol {
		return this.proxyProtocolSubject.value;
	}

	public setProxyProtocol(value: ProxyProtocol): void {
		this.proxyProtocolSubject.next(value);
	}

	public proxyIpAddress(): string {
		return this.proxyIpAddressSubject.value;
	}

	public setProxyIpAddress(value: string): void {
		this.proxyIpAddressSubject.next(value);
	}

	public proxyPort(): string {
		return this.proxyPortSubject.value;
	}

	public setProxyPort(value: string): void {
		this.proxyPortSubject.next(value);
	}

	public async ping(pingSession?: Session, timeout: number = PING_TIMEOUT): Promise<boolean> {
		try {
			const response = await get({ url: PING_URL, session: pingSession, timeout });
			return response.code === HttpResponseCode.OK;
		}
		catch {
			return false;
		}
	}

	@logCall
	public async testProxy(): Promise<boolean> {
		const proxySession = session.fromPartition('proxySession');
		await proxySession.clearAuthCache();

		const isProxyApplied = await this.setUpProxyForSession(proxySession);
		if (!isProxyApplied) {
			return false;
		}

		// a request through a proxy needs more time than a direct ping (proxy handshake + authentication)
		const proxyTestTimeout = 10_000;

		return this.ping(proxySession, proxyTestTimeout);
	}

	@logCall
	public async applyProxySettingsForSession(targetSession: Session): Promise<boolean> {
		if (!this.proxyEnabledSubject.value) {
			return false;
		}

		return this.setUpProxyForSession(targetSession);
	}

	@logCall
	public turnOffProxy(): void {
		this.proxyEnabledSubject.next(false);

		app.relaunch();
		app.quit();
	}

	private subscribeAll(): void {
		this.subscriptions.push(
			this.proxyEnabledSubject.subscribe((value) => {
				appSettingsService().set('isProxyEnabled', value);
			}),
			this.proxyProtocolSubject.subscribe((value) => {
				appSettingsService().set('proxyProtocol', value);
			}),
			this.proxyIpAddressSubject.subscribe((value) => {
				appSettingsService().set('proxyServerIpAddress', value);
			}),
			this.proxyPortSubject.subscribe((value) => {
				appSettingsService().set('proxyServerPort', value);
			})
		);

		const shutdownSub = appEventService().shutdown.subscribe(() => {
			shutdownSub.unsubscribe();
			this.dispose();
		});
	}

	private buildProxyRules(): string | null {
		const protocol = this.proxyProtocolSubject.value;
		const ipAddress = this.proxyIpAddressSubject.value.trim();
		let port = this.proxyPortSubject.value.trim();
		const defaultPort = DEFAULT_PROXY_PORTS.get(protocol);

		if (port === '' && defaultPort !== undefined) {
			port = defaultPort;
		}

		if (ipAddress === '' || !isValidNetworkPort(port)) {
			loggerService().warn(`NetworkService: invalid proxy settings, address: "${ ipAddress }", port: "${ port }"`);
			return null;
		}

		return `${ protocol }://${ ipAddress }:${ port }`;
	}

	/**
	 * the single place that turns the current proxy settings into a session configuration:
	 * both the app session (applyProxySettingsForSession) and the test session (testProxy) use it
	 */
	private async setUpProxyForSession(targetSession: Session): Promise<boolean> {
		const proxyRules = this.buildProxyRules();
		if (proxyRules === null) {
			return false;
		}

		loggerService().info(`Connect to proxy server ${ proxyRules }`);
		await targetSession.setProxy({ proxyRules });

		return true;
	}
}
