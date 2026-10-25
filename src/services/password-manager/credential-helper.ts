import { Credentials } from './ipassword-manager-service';

export const credentialHelper = (isPopup?: boolean): void => {
	if (window.tvdCredentialHelperStarted) {
		return;
	}

	const isTradovate = (): boolean => document.title.toLowerCase().includes('tradovate');

	window.tvdCredentialHelperStarted = true;
	enum LogLevel {
		Debug,
		Info,
		Warn,
		Error,
	}
	window.TVD.log({ message: '[Credential Helper]: script started', level: LogLevel.Debug });
	const removeAutocompleteDiv = (): void => {
		if (!isPopupVisible) {
			return;
		}
		isPopupVisible = false;
		const div = document.getElementById(autocompleteId);
		if (div) {
			div.remove();
		}
	};

	const removeAutocompleteDivWithoutInsertCredentials = (): void => {
		if (!isPopupVisible) {
			return;
		}
		initCredentials().then(() => {
			removeAutocompleteDiv();
		}).catch(error => window.TVD.log({ message: '[Credential Helper]: getCredentials error', level: LogLevel.Error, error: error as unknown }));
	};

	const closeCredentialsPopupByMouseClick = (ev: MouseEvent): void => {
		if (!ev) {
			return;
		}

		const autocompleteDiv = document.getElementById(autocompleteId);
		if (!autocompleteDiv) {
			return;
		}

		// click inside
		if (ev.target instanceof Node && autocompleteDiv.contains(ev.target)) {
			return;
		}

		// click outside
		removeAutocompleteDivWithoutInsertCredentials();
	};

	const closeCredentialsPopupByKeyboardPress = (e: KeyboardEvent): void => {
		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line no-mixed-operators
		if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'Tab' && !e.ctrlKey) {
			removeAutocompleteDivWithoutInsertCredentials();
			window.TVD.log({ message: '[Credential Helper]: credentials popup closed by keyboard press', level: LogLevel.Info });
		}
	};

	const closeCredentialsPopupByResize = (): void => {
		removeAutocompleteDivWithoutInsertCredentials();
	};

	const insertCredentials = async(loginElement: Element, loginInput: string, passwordElement: Element,
		passwordInput: string): Promise<void> => {
		let passwordLength;
		let accountLength;
		const loginEl = loginElement as HTMLInputElement;
		const passwordEl = passwordElement as HTMLInputElement;

		if (isTradovate()) {
			passwordLength = passwordEl.value.length;
			accountLength = loginEl.value.length;
		}
		else {
			passwordEl.value = '';
			loginEl.value = '';
		}

		if (!isPopup) {
			loginEl.value = loginInput;
			passwordEl.value = passwordInput;

			return;
		}

		loginEl.focus();

		try {
			await window.TVD.insertCredentialsText({ account: loginInput, accountLength, password: passwordInput, passwordLength });
		}
		catch (error) {
			window.TVD.log({ message: '[Credential Helper]: Error at insert credentials', level: LogLevel.Error, error });
		}
	};

	const setColor = (light: string, dark: string): string => {
		if (!window.TradingViewApi || window.TradingViewApi.themes().getCurrentThemeName() === 'light') {
			return light;
		}

		return dark;
	};

	const createCredentialsElement = (input: Element, credentialsCount: number): Element => {
		const maxPopupHeight = 320;
		const credentialsLineHeight = 52;
		const credentialsPadding = 12;
		const popupHeight = credentialsCount * credentialsLineHeight + credentialsPadding;
		const limitedPopupHeight = popupHeight < maxPopupHeight ? popupHeight : maxPopupHeight;

		const credentialsDiv = document.createElement('div');
		credentialsDiv.setAttribute('id', autocompleteId);

		credentialsDiv.style.display = 'block';
		credentialsDiv.style.position = 'absolute';

		const rect = input.getBoundingClientRect();
		const top = rect.y + window.scrollY;
		const left = rect.x + window.scrollX;

		credentialsDiv.style.top = `${ Math.floor(top + rect.height) }px`;
		credentialsDiv.style.left = `${ Math.floor(left) }px`;

		credentialsDiv.style.width = '329px';
		credentialsDiv.style.maxHeight = `${ limitedPopupHeight }px`;

		credentialsDiv.style.backgroundColor = setColor('#FFFFFF', '#1E222D');
		credentialsDiv.style.color = setColor('#000000', '#D1D4DC');

		credentialsDiv.style.boxShadow = '0px 0px 6px rgba(67, 70, 81, 0.22)';
		credentialsDiv.style.borderRadius = '4px';
		credentialsDiv.style.zIndex = '200';
		credentialsDiv.style.padding = '6px 0px 6px 0px';

		credentialsDiv.style.overflow = popupHeight < maxPopupHeight ? 'hidden' : 'scroll';
		credentialsDiv.style.overflowX = 'hidden';

		document.body.appendChild(credentialsDiv);

		credentialsDiv.addEventListener('click', (event) => event.stopPropagation(), false);

		return credentialsDiv;
	};

	const inputClickHandler = async(input: Element, loginEl: Element, item: Element): Promise<void> => {
		window.TVD.log({ message: '[Credential Helper]: login or password field clicked', level: LogLevel.Info });
		await initCredentials();

		if (!storedCredentials || storedCredentials.length <= 1) {
			return;
		}
		if (document.getElementById(autocompleteId)) {
			return;
		}

		const credentialsDiv = createCredentialsElement(input, storedCredentials.length);

		const createFieldElement = (): HTMLDivElement => {
			const el = document.createElement('div');
			el.style.maxWidth = '329px';
			el.style.height = '26px';
			el.style.textOverflow = 'ellipsis';
			el.style.overflow = 'hidden';
			el.style.whiteSpace = 'nowrap';

			return el;
		};

		storedCredentials.forEach(c => {
			const credential = document.createElement('div');
			credential.style.padding = '0px 16px 0px 16px';
			credential.style.fontFamily = '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, SegoeUI, Ubuntu, sans-serif;';
			credential.style.fontSize = '14px';
			credential.style.lineHeight = '22px';

			const account = createFieldElement();
			const accountText = document.createElement('text');
			accountText.innerHTML += c.account;

			const password = createFieldElement();
			const passwordText = document.createElement('text');
			passwordText.innerHTML += new Array(c.password.length + 1).join('&#149');

			account.appendChild(accountText);
			password.appendChild(passwordText);

			credential.appendChild(account);
			credential.appendChild(password);

			credentialsDiv.appendChild(credential);

			const insertCredentialsAndClose = (): void => {
				void insertCredentials(loginEl, c.account, item, c.password);
				removeAutocompleteDiv();
				window.TVD.log({ message: '[Credential Helper]: inserted credentials by mouse click', level: LogLevel.Info });
			};

			const mouseOverCredentialItem = (): void => {
				credential.style.backgroundColor = setColor('#F0F3FA', '#2A2E39');
			};

			const mouseLeaveCredentialItem = (): void => {
				credential.style.backgroundColor = setColor('#FFFFFF', '#1E222D');
			};

			credential.addEventListener('click', insertCredentialsAndClose, false);
			credential.addEventListener('mouseover', mouseOverCredentialItem, false);
			credential.addEventListener('mouseleave', mouseLeaveCredentialItem, false);
		});
		window.TVD.log({ message: '[Credential Helper]: credentials popup showed', level: LogLevel.Info });
	};

	const initCredentials = async(): Promise<void> => {
		if (!storedCredentials) {
			storedCredentials = await window.TVD.getCredentials();
		}
	};

	const submitHandler = (form: HTMLFormElement, loginEl: Element, passwordEl: Element): void => {
		if (didSubmit) {
			return;
		}
		window.TVD.log({ message: '[Credential Helper]: form submitted', level: LogLevel.Info });
		didSubmit = true;

		form.setAttribute('listenerSubmit', 'true');
		window.TVD
			.setCredentials({
				password: (passwordEl as HTMLInputElement).value,
				account: (loginEl as HTMLInputElement).value,
			})
			.then(() => {
				storedCredentials = undefined;
				void initCredentials();
			})
			.catch(error => window.TVD.log({ message: '[Credential Helper]: Error at setCredentials', level: LogLevel.Error, error: error as unknown }));

		const submitDelay = 200;

		setTimeout(() => {
			didSubmit = false;
		}, submitDelay);
	};

	const insertSingleCredentials = (loginEl: HTMLInputElement, passwordEl: HTMLInputElement): void => {
		if (!storedCredentials || storedCredentials?.length !== 1) {
			return;
		}

		if (loginEl.value && passwordEl.value) {
			return;
		}

		void insertCredentials(
			loginEl,
			storedCredentials[0].account,
			passwordEl,
			storedCredentials[0].password
		);
		window.TVD.log({ message: '[Credential Helper]: insert single credentials', level: LogLevel.Info });
	};

	const findFormAndSendCredentials = (form: HTMLFormElement | undefined): void => {
		if (!form) {
			return;
		}

		const scriptInjectedAttr = 'data-tvd-credential-helper-inserted-single-credentials';

		if (form.hasAttribute(scriptInjectedAttr)) {
			return;
		}

		form.setAttribute(scriptInjectedAttr, 'true');

		let loginElement: Element | undefined;
		let passwordElement: Element | undefined;

		const isSaxo = document.querySelector('#divSsoContent');
		const isCapital = document.title.toLowerCase().includes('capital.com');
		const isQuestrade = document.URL.includes('questrade.com');
		const isDNSE = document.URL.includes('dnse.com.vn');

		if (isSaxo) {
			window.addEventListener('unload', () => {
				if (loginElement && passwordElement) {
					void window.TVD.setCredentials({
						password: (passwordElement as HTMLInputElement).value,
						account: (loginElement as HTMLInputElement).value,
					});
				}
			});
		}

		if (isQuestrade) {
			// temporary turn autofill off for Questrade
			return;
		}

		Array.from(form).forEach((passwordEl, k) => {
			if ((passwordEl as HTMLInputElement).type !== 'password') {
				return;
			}

			function getLoginElement(formWithLogin: HTMLFormElement): Element {
				switch (true) {
					case isDNSE: {
						const loginElList = formWithLogin.ownerDocument.getElementsByName('username');
						if (loginElList.length > 0) {
							return loginElList[0];
						}
						// falls through
					}
					case isTradovate(): {
						return formWithLogin[k - 2];
					}
					default:
						return formWithLogin[k - 1];
				}
			}

			const loginEl = getLoginElement(form);

			const onInputClick = (input: Element): void => {
				isPopupVisible = true;

				inputClickHandler(input, loginEl, passwordEl)
					.catch(error => window.TVD.log({ message: '[Credential Helper]: Error at inputClickHandler', level: LogLevel.Error, error: error as unknown }));
			};

			const onSubmit = (): void => {
				submitHandler(form, loginEl, passwordEl);
			};

			passwordEl.addEventListener('click', () => onInputClick(passwordEl), false);
			loginEl.addEventListener('click', () => onInputClick(loginEl), false);
			if (isCapital) {
				const submitButton = form.getElementsByTagName('button')[0];
				submitButton.addEventListener('click', onSubmit, false);
			}
			else if (isTradovate()) {
				const submitButton = form.getElementsByTagName('button')[1];
				submitButton.addEventListener('click', onSubmit, false);
			}
			else {
				form.addEventListener('submit', onSubmit, false);
			}
			// tradovate form needs some time to be ready, so we set a delay before inserting credentials, for other platforms it will be 0
			const tradovateDelay = 2000;
			setTimeout(() => {
				initCredentials()
					.then(() => {
						insertSingleCredentials(loginEl as HTMLInputElement, passwordEl as HTMLInputElement);
					})
					.catch(error => {
						window.TVD.log({ message: '[Credential Helper]: Error at initCredentials', level: LogLevel.Error, error: error as unknown });
					});
			}, isTradovate() ? tradovateDelay : 0);
		});
	};

	const getForm = (): HTMLFormElement | undefined => {
		const formArray = Array.from(document.getElementsByTagName('form'));
		const isTradier = document.title.toLowerCase().includes('tradier');
		if (formArray.length < 1) {
			return;
		}
		if (formArray.length === 1) {
			return formArray[0];
		}
		if (isTradier) {
			return formArray[1];
		}
		return formArray.find(value => !value.className.toLowerCase().includes('hidden'));
	};

	const autocompleteId = 'tvd:autocomplete_credentials';
	const mutationObserverTimeout = 100;

	let isPopupVisible = false;
	let didSubmit = false;

	let storedCredentials: Credentials[] | undefined;

	window.addEventListener('mousedown', e => closeCredentialsPopupByMouseClick(e), false);
	window.addEventListener('resize', () => closeCredentialsPopupByResize());
	window.addEventListener('keydown', e => closeCredentialsPopupByKeyboardPress(e), false);

	initCredentials().catch(error => window.TVD.log({ message: '[Credential Helper]: Error at initCredentials', level: LogLevel.Error, error: error as unknown }));

	findFormAndSendCredentials(getForm());

	const observerBase = new MutationObserver(() => setTimeout(() => {
		findFormAndSendCredentials(getForm());
	}, mutationObserverTimeout));

	const observerBody = new MutationObserver(() => setTimeout(() => {
		const targetOverlapBody = document.querySelector('#overlap-manager-root');
		if (targetOverlapBody) {
			findFormAndSendCredentials(getForm());
			observerBase.observe(targetOverlapBody, config);
		}
	}, mutationObserverTimeout));

	const targetBody = document.querySelector('body');
	const targetOverlap = document.querySelector('#overlap-manager-root');
	const targetChaka = document.querySelector('#__next');
	const targetAlpaca = document.querySelector('#root');
	const targetTradovate = document.querySelector('.tradovate > #content');

	const config = { attributes: true, childList: true, characterData: true };

	if (isPopup) {
		if (targetChaka) {
			observerBase.observe(targetChaka, config);
		}
		else if (targetAlpaca) {
			observerBase.observe(targetAlpaca, config);
		}
		else if (targetTradovate) {
			observerBase.observe(targetTradovate, config);
		}
		else if (targetBody) {
			observerBody.observe(targetBody, config);
		}
	}
	else {
		if (targetOverlap) {
			observerBase.observe(targetOverlap, config);
		}
		else if (targetBody) {
			observerBody.observe(targetBody, config);
		}
	}
};
