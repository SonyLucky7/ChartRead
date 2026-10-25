import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { app } from '@electron/remote';
import { Checkbox } from '@tradingview/ui-lib/checkbox';
import { ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';

import { loggerServiceProxy } from '../../../../logger';
import { networkServiceProxy } from '../../../../main/network';
import { getProxyLoginAndPassword, PROXY_SERVICE_ACCOUNT_NAME, PROXY_SERVICE_NAME, PROXY_SERVICE_PASSWORD_NAME } from '../../../../main/network/proxy-credentials';
import { ProxyProtocol } from '../../../../main/network/proxy-protocol';
import { Credentials, passwordManagerServiceProxy } from '../../../../services/password-manager';
import { trackEventServiceProxy } from '../../../../services/track-event-service';
import { getMessageOfError } from '../../../../tvd-runtime/core';
import { useForm, useObservable } from '../../../components-ui/hooks';
import { TextInput } from '../../../components-ui/text-input';
import ComboboxComponent from '../../controls/combobox';
import { ComboboxItem } from '../../controls/combobox/combobox-item';
import { SettingsSection } from '../settings-section';
import { useKeyDownHandler } from '../use-keydown-handler';

import './network-settings.css';

interface NetworkSettingsProps {
	setWarningText: Dispatch<SetStateAction<string | null>>;
	setCustomButtonText: Dispatch<SetStateAction<string | null>>;
	setWarningCallback: Dispatch<SetStateAction<(() => void) | null>>;
	setIsErrorWarning: Dispatch<SetStateAction<boolean>>;
	setIsLoaderShowing: Dispatch<SetStateAction<boolean>>;
	resetRelaunchWarning(): void;
}

interface ProxyValuesInput {
	isEnabled: boolean | null;
	protocol: ProxyProtocol;
	ipAddress: string;
	port: string;
	username: string;
	password: string;
}

const enum ConnectionTestStatus {
	Idle = 'idle',
	Testing = 'testing',
	Failure = 'failure',
}

const enum NetworkSettingsFieldName {
	IpAddress = 'ipAddress',
	Port = 'port',
	Username = 'username',
	Password = 'password',
}

const IS_PROXY_ENABLED_CHECKBOX_ID = 'isProxyEnabled';

const proxyProtocolLabels: Record<ProxyProtocol, string> = {
	[ProxyProtocol.Http]: 'HTTP',
	[ProxyProtocol.Socks5]: 'SOCKS5',
};

const proxyProtocols: ComboboxItem<ProxyProtocol>[] =
	Object.values(ProxyProtocol).map((id) => ({
		id,
		label: proxyProtocolLabels[id],
	}));

function getFieldChangeHandler(
	name: keyof ProxyValuesInput,
	inputOnChangeCallback: (name: keyof ProxyValuesInput, value: string) => void,
): ((value: string) => void) | null {
	function credentialChangeHandler(
		fieldName: NetworkSettingsFieldName.Username | NetworkSettingsFieldName.Password,
		credentialName: typeof PROXY_SERVICE_ACCOUNT_NAME | typeof PROXY_SERVICE_PASSWORD_NAME,
	): (value: string) => void {
		return (value: string): void => {
			if (value.length < 1) {
				passwordManagerServiceProxy().deletePassword(credentialName, PROXY_SERVICE_NAME);
			}
			else {
				passwordManagerServiceProxy().setPassword(credentialName, value, PROXY_SERVICE_NAME);
			}

			inputOnChangeCallback(fieldName, value);
		};
	}

	const fieldChangeHandlerMap = new Map<keyof ProxyValuesInput, (value: string) => void>([
		[NetworkSettingsFieldName.IpAddress, (value: string): void => { networkServiceProxy().setProxyIpAddress(value); }],
		[NetworkSettingsFieldName.Port, (value: string): void => { networkServiceProxy().setProxyPort(value); }],
		[NetworkSettingsFieldName.Username, credentialChangeHandler(NetworkSettingsFieldName.Username, PROXY_SERVICE_ACCOUNT_NAME)],
		[NetworkSettingsFieldName.Password, credentialChangeHandler(NetworkSettingsFieldName.Password, PROXY_SERVICE_PASSWORD_NAME)],
	]);

	return fieldChangeHandlerMap.get(name) ?? null;
}

export const NetworkSettings = ({
	setWarningText,
	setCustomButtonText,
	setWarningCallback,
	setIsErrorWarning,
	setIsLoaderShowing,
	resetRelaunchWarning,
}: NetworkSettingsProps): JSX.Element => {
	const { t } = useTranslation();

	const { values: proxyValues, handleValueChange } = useForm<ProxyValuesInput>({
		isEnabled: null,
		protocol: proxyProtocols[0].id,
		ipAddress: '',
		port: '',
		username: '',
		password: '',
	});
	const [isProxyIpAddressValid, setIsProxyIpAddressValid] = useState<boolean>(true);
	const [isProxyPortValid, setIsProxyPortValid] = useState<boolean>(true);
	const [isProxyInitiallyEnabled, setIsProxyInitiallyEnabled] = useState<boolean | null>(null);
	const [connectionTestStatus, setConnectionTestStatus] = useState<ConnectionTestStatus>(ConnectionTestStatus.Idle);

	useEffect(() => {
		const getProxyPassword = async(): Promise<void> => {
			let credentials: Credentials | null = null;
			try {
				credentials = await getProxyLoginAndPassword();
			}
			catch (err) {
				loggerServiceProxy().error('Network settings: Problems with fetching of proxy credentials');
			}

			if (credentials === null) {
				handleValueChange('username', '');
				handleValueChange('password', '');

				return;
			}

			const { account, password } = credentials;

			handleValueChange('username', account);
			handleValueChange('password', password);
		};

		getProxyPassword()
			.catch((error) => { loggerServiceProxy().error(getMessageOfError(error)); });
	/**
	 * handleValueChange dependency will cause useEffect call
	 * on every render
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (
			isProxyInitiallyEnabled !== null &&
			proxyValues.isEnabled !== null &&
			isProxyInitiallyEnabled !== proxyValues.isEnabled
		) {
			showRelaunchWarning(proxyValues.isEnabled);
		}
	/**
	 * showRelaunchWarning is excluded so it is not wrapped in useCallback for only this hook
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isProxyInitiallyEnabled, proxyValues.isEnabled]);

	const relaunchCallback = (isProxyEnabled: boolean): void => {
		if (!isProxyEnabled) {
			app.relaunch();
			app.quit();

			return;
		}

		const validateProxyData = (): boolean => {
			const maxPortNumber = 65534;
			const minPortNumber = 1;

			const isIpAddressValid = proxyValues.ipAddress.trim() !== '';
			setIsProxyIpAddressValid(isIpAddressValid);

			const proxyPort = Number.parseInt(proxyValues.port, 10);
			const isPortValid = !Number.isNaN(proxyPort) && proxyPort >= minPortNumber && proxyPort <= maxPortNumber;

			setIsProxyPortValid(isPortValid);

			return isIpAddressValid && isPortValid;
		};

		if (!validateProxyData()) {
			return;
		}

		setConnectionTestStatus(ConnectionTestStatus.Testing);
		setIsLoaderShowing(true);

		const showProxyTestFailureWarning = (): void => {
			setConnectionTestStatus(ConnectionTestStatus.Failure);

			setIsErrorWarning(true);
			setIsLoaderShowing(false);
			setWarningText(t('Please check your internet connection or try again later'));
			setCustomButtonText(t('Ok'));
			setWarningCallback(() => resetRelaunchWarningAndConnectionStatus);
		};

		networkServiceProxy().testProxy()
			.then((result) => {
				if (!result) {
					showProxyTestFailureWarning();
					return;
				}

				networkServiceProxy().setProxyEnabled(true);
				trackEventServiceProxy().trackEvent({ eventName: 'proxy_enabled' });
				app.relaunch();
				app.quit();
			})
			.catch(() => {
				showProxyTestFailureWarning();
			});
	};

	const showRelaunchWarning = (isProxyEnabled: boolean): void => {
		resetRelaunchWarningAndConnectionStatus();
		setWarningText(t('Relaunch for changes to take effect'));
		setWarningCallback(() => () => { relaunchCallback(isProxyEnabled); });
	};

	const resetRelaunchWarningAndConnectionStatus = (): void => {
		setConnectionTestStatus(ConnectionTestStatus.Idle);
		resetRelaunchWarning();
	};

	useObservable<boolean>(networkServiceProxy().proxyEnabledChange, (isEnabled: boolean): void => {
		if (proxyValues.isEnabled === null) {
			handleValueChange('isEnabled', isEnabled);
		}
		setIsProxyInitiallyEnabled((prevState) => prevState === null ? isEnabled : prevState);
	}, [proxyValues.isEnabled]);
	useObservable<ProxyProtocol>(networkServiceProxy().proxyProtocolChange, (protocol) => { handleValueChange('protocol', protocol); });
	useObservable<string>(networkServiceProxy().proxyIpAddressChange, (ipAddress) => { handleValueChange('ipAddress', ipAddress); });
	useObservable<string>(networkServiceProxy().proxyPortChange, (port) => { handleValueChange('port', port); });

	const keyDownCheckboxActions = useMemo(() => ({
		[IS_PROXY_ENABLED_CHECKBOX_ID]: (value: boolean) => { handleValueChange('isEnabled', value); },
	/**
	 * avoiding redundant renders in useKeyDownHandler
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}), []);

	useKeyDownHandler(keyDownCheckboxActions);

	const toggleIsProxyEnabled = (): void => {
		const nextState = !proxyValues.isEnabled;

		handleValueChange('isEnabled', nextState);

		if (nextState === isProxyInitiallyEnabled) {
			resetRelaunchWarningAndConnectionStatus();
			return;
		}

		showRelaunchWarning(nextState);

		if (nextState) {
			return;
		}

		// track 'proxy_disabled' when proxy is about to get disabled
		if (isProxyInitiallyEnabled) {
			trackEventServiceProxy().trackEvent({ eventName: 'proxy_disabled' });
		}

		networkServiceProxy().setProxyEnabled(false);
		setIsProxyIpAddressValid(true);
		setIsProxyPortValid(true);
	};

	const protocolChangeHandler = (protocol: ProxyProtocol): void => {
		handleValueChange('protocol', protocol);

		if (isProxyInitiallyEnabled) {
			networkServiceProxy().setProxyEnabled(false);
		}
		// TODO: do not save changes to file on every input, changes must be saved on submit
		networkServiceProxy().setProxyProtocol(protocol);

		showRelaunchWarning(Boolean(proxyValues.isEnabled));
	};

	const isProxyValue = (key: string): key is keyof ProxyValuesInput => key in proxyValues;

	const inputChangeHandler = ({ target: { name, value } }: React.ChangeEvent<HTMLInputElement>): void => {
		if (!isProxyValue(name)) {
			return;
		}

		if (isProxyInitiallyEnabled) {
			networkServiceProxy().setProxyEnabled(false);
		}

		const fieldChangeHandler = getFieldChangeHandler(name, handleValueChange);

		fieldChangeHandler?.(value);

		if (name === NetworkSettingsFieldName.IpAddress && !isProxyIpAddressValid) {
			setIsProxyIpAddressValid(true);
		}

		if (name === NetworkSettingsFieldName.Port && !isProxyPortValid) {
			setIsProxyPortValid(true);
		}

		showRelaunchWarning(Boolean(proxyValues.isEnabled));
	};

	const isInputDisabled = !proxyValues.isEnabled || connectionTestStatus === ConnectionTestStatus.Testing;

	return (
		<div className='settings-network'>
			<SettingsSection label={ t('PROXY SETTINGS') }>
				<Checkbox
					id={ IS_PROXY_ENABLED_CHECKBOX_ID }
					checked={ Boolean(proxyValues.isEnabled) }
					onChange={ toggleIsProxyEnabled }
					label={ t('Use a proxy server') }
					tabIndex={ 1 }
				/>
			</SettingsSection>

			<SettingsSection label={ t('Proxy protocol') } className='settings-network-input-select'>
				<ComboboxComponent<ProxyProtocol, string>
					tabIndex={ 2 }
					hasKeyboardNavigation={ true }
					defaultSelectedId={ proxyValues.protocol }
					items={ proxyProtocols }
					onChange={ protocolChangeHandler }
					isDisabled={ isInputDisabled }
				/>
			</SettingsSection>

			<TextInput
				value={ proxyValues.ipAddress }
				onChange={ inputChangeHandler }
				className='settings-network-text-input'
				disabled={ isInputDisabled }
				errorMessage={ t('This field is required') }
				label={ `${ t('Server IP address or domain name') }*` }
				maxLength={ 255 }
				name={ NetworkSettingsFieldName.IpAddress }
				placeholder='127.0.0.1'
				size={ ControlSize.Small }
				valid={ isProxyIpAddressValid }
			/>

			<TextInput
				value={ proxyValues.port }
				onChange={ inputChangeHandler }
				className='settings-network-text-input'
				disabled={ isInputDisabled }
				errorMessage={ t('This field is required') }
				label={ `${ t('Port') }*` }
				maxLength={ 255 }
				name={ NetworkSettingsFieldName.Port }
				placeholder='3128'
				size={ ControlSize.Small }
				valid={ isProxyPortValid }
			/>

			{ proxyValues.protocol !== ProxyProtocol.Socks5 &&
					<>
						<TextInput
							value={ proxyValues.username }
							onChange={ inputChangeHandler }
							className='settings-network-text-input'
							disabled={ isInputDisabled }
							label={ t('Username') }
							maxLength={ 255 }
							name={ NetworkSettingsFieldName.Username }
							size={ ControlSize.Small }
						/>

						<TextInput
							value={ proxyValues.password }
							onChange={ inputChangeHandler }
							className='settings-network-text-input'
							disabled={ isInputDisabled }
							label={ t('Password') }
							maxLength={ 255 }
							name={ NetworkSettingsFieldName.Password }
							size={ ControlSize.Small }
							type='password'
						/>
					</>
			}
		</div>
	);
};
