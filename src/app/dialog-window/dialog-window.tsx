import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Subscription } from 'rxjs';
import { CloseButton } from '@tradingview/ui-lib/buttons/close-button';
import { ButtonSize, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Divider, DividerOrientation, DividerSize, DividerType } from '@tradingview/ui-lib/divider';
import { Typography } from '@tradingview/ui-lib/typography';

import { IpcServices } from '../../ipc-services';
import { loggerServiceProxy } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { setupI18nLocaleHandler } from '../../services/locale';
import { windowServiceProxy } from '../../services/window';
import { DialogActionType, DialogData, DialogInput, DialogProps, DialogType, DialogWindowData, InputSnapshot } from '../../services/window/window-api';
import { isDarwin, KeyboardEventKey } from '../../utils';
import { getDialogControl, getRendererInitialData, notifyViewReady } from '../common/app-common';
import { ComponentRenderer } from '../renderer-services/renderer';
import { dialogContentRenderer } from '.';

import TokyoFilter from '../assets/tokyo-filter.svg';

import './dialog-window.css';

IpcServices.initializeRpc();

interface State {
	hasTokyoNight: boolean;
	data?: DialogData;
	renderer?: ComponentRenderer<DialogProps<DialogData>>;
}

@logCallName('DialogWindow')
export default class DialogWindow extends Component<WithTranslation, State> {
	private dataChangeSubscription: Subscription | null = null;

	private dialogInput?: DialogInput;
	private tokyoNightSubscription: Subscription | null = null;

	override state: State = {
		hasTokyoNight: false,
	};

	constructor(props: WithTranslation) {
		super(props);

		this.keyDownHandler = this.keyDownHandler.bind(this);
		this.unsubscribeEvents = this.unsubscribeEvents.bind(this);
	}

	override componentDidMount(): void {
		setupI18nLocaleHandler(document.documentElement);
		notifyViewReady();

		const { dialogData } = getRendererInitialData<DialogWindowData>();
		this.setState({ data: dialogData });

		const renderer = dialogContentRenderer.getRenderer(dialogData.type);
		this.setState({ renderer });

		windowServiceProxy().getTokyoNightStatus()
			.then((hasTokyoNight) => {
				this.setState({ hasTokyoNight });
			})
			.catch(error => {
				loggerServiceProxy().error('<DialogWindow>.componentDidMount(): windowServiceIpc().getTokyoNightStatus() error', error);
			});

		this.tokyoNightSubscription = windowServiceProxy().tokyoNightSubject.subscribe((hasTokyoNight) => {
			this.setState({ hasTokyoNight });
		});

		addEventListener('keydown', this.keyDownHandler);

		window?.addEventListener('beforeunload', this.unsubscribeEvents);
	}

	override render(): JSX.Element {
		if (this.state.data === undefined) {
			return <></>;
		}

		if ([DialogType.SaveChanges, DialogType.Welcome].includes(this.state.data.type)) {
			return this.renderer();
		}

		const isSettings = this.state.data.type === DialogType.Settings;

		return (
			<>
				{ this.state.hasTokyoNight && <div style={ { display: 'none' } }><TokyoFilter/></div> }
				<div className={ `dialog ${ this.state.data.type ?? '' } ${ this.state.hasTokyoNight ? 'tokyo-night' : '' }` }>
					<Typography
						tag='h1'
						name='typography-accent-20px-semibold'
						className='dialog-title'
					>
						{ isSettings ? this.props.t('Settings') : this.state.data.title ?? '' }
					</Typography>

					{ this.state.data.type === DialogType.Options &&
						<Divider
							orientation={ DividerOrientation.Horizontal }
							type={ DividerType.Primary }
							size={ DividerSize.XSmall }
							className='dialog-window-separator'
						/>
					}
					<div className='dialog-content'>
						{ this.state.data.text &&
							<Typography
								tag='p'
								name='typography-regular-16px'
								className='dialog-text'
							>
								{ this.state.data.text }
							</Typography>
						}
						{ this.renderer() }
					</div>
					{ [DialogType.Credentials, DialogType.Options].includes(this.state.data.type) &&
						<Divider
							orientation={ DividerOrientation.Horizontal }
							type={ DividerType.Primary }
							size={ DividerSize.XSmall }
							className='dialog-window-separator'
						/>
					}

					{ this.state.data.buttons &&
						<div className='dialog-buttons'>
							{ this.state.data.buttons.map(({ text, color, variant, id }, index) =>
								<SquareButton
									key={ id }
									onClick={ () => this.submit(id, index) }
									size={ ButtonSize.Small }
									color={ color }
									variant={ variant }
								>
									{ text }
								</SquareButton>
							) }
						</div>
					}
					<div className='dialog-close-button'>
						<CloseButton
							aria-label='close-dialog-window'
							onClick={ () => this.close(DialogActionType.Cross) }
							size={ ButtonSize.Medium }
							tabIndex={ !isSettings || isDarwin() ? -1 : 0 }
						/>
					</div>
				</div>
			</>
		);
	}

	@logCall
	private close(dialogActionType: DialogActionType): void {
		getDialogControl().closeDialogWindow(dialogActionType)
			.catch((error) => {
				loggerServiceProxy().error('<DialogWindow>.close(): getDialogControl().closeDialogWindow() error', error);
			});
	}

	@logCall
	private keyDownHandler(event: KeyboardEvent): void {
		if (event.code === KeyboardEventKey.Escape) {
			// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
			// eslint-disable-next-line no-mixed-operators
			if (this.state.data?.type === DialogType.SaveChanges || this.state.data?.type === DialogType.Welcome && !this.state.data.closable) {
				return;
			}

			this.close(DialogActionType.Esc);
		}
	}

	private unsubscribeEvents(): void {
		removeEventListener('keydown', this.keyDownHandler);

		if (this.tokyoNightSubscription) {
			this.tokyoNightSubscription.unsubscribe();
			this.tokyoNightSubscription = null;
		}

		if (this.dataChangeSubscription) {
			this.dataChangeSubscription.unsubscribe();
			this.dataChangeSubscription = null;
		}

		window?.removeEventListener('beforeunload', this.unsubscribeEvents);
	}

	@logCall
	private submit(dialogAction: DialogActionType, button: number): void {
		const input: InputSnapshot = {
			dialogAction,
			button,
			input: this.dialogInput,
		};

		getDialogControl().submitInput(input)
			.catch((error) => {
				loggerServiceProxy().error('<DialogWindow>.submit(): getDialogControl().submitInput() error', error);
			});
	}

	private onInputChange(snapshot: DialogInput): void {
		this.dialogInput = snapshot;
	}

	private renderer(): JSX.Element {
		if (!this.state.renderer || !this.state.data) {
			return <></>;
		}

		return this.state.renderer(
			{
				inputChange: (s) => this.onInputChange(s),
				data: this.state.data,
			}
		);
	}
}
