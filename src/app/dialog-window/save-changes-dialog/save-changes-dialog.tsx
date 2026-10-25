import { TFunction } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonSize, CloseButton } from '@tradingview/ui-lib/buttons/close-button';
import { ButtonColor, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { CircleProgressbar, CircleProgressbarIntent, CircleProgressbarSize } from '@tradingview/ui-lib/progressbar/circle-progressbar';
import { Typography } from '@tradingview/ui-lib/typography';

import { windowServiceProxy } from '../../../services/window';
import { SaveChangesDecisionType, SaveChangesErrorState, SaveChangesScopeType } from '../../../services/window/tab/save-changes-types';
import { DialogProps, getLocaleBasedSaveChangesDialogSize, SaveChangesDialog as DialogSaveChanges } from '../../../services/window/window-api';
import { isDarwin } from '../../../utils';
import { useObservable } from '../../components-ui/hooks';

import ErrorIcon from './assets/error-icon.svg';

import './save-changes-dialog.css';

// Fisher-Yates shuffle
const shuffle = (array: string[]): string[] => {
	const shuffledArray: string[] = [...array.filter(str => str !== '')];
	for (let i = shuffledArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
	}
	return shuffledArray;
};

const getAdvices = (t: TFunction): string[] => shuffle([
	t('Sometimes the best trades are the ones you did not take.'),
	t('Trading more ≠ more profits.'), // turn off ASCII characters check
	t('The market doesn\'t care about you or your position.'),
	t('It\'s okay to love trading.'),
	t('Not being stressed from a loss is the real flex.'),
	t('Stop buying lottery tickets.'),
	t('"So happy I spent $200 on trading signals" - said no trader ever.'),
	t('Always do your research.'),
	t('How to feel awful: stare at your account / trades all day.'),
	t('When you think you\'ve got the keys to the market, they change the locks.'),
	t('Weak traders focus on results - Strong traders focus on process.'),
	t('Simplify your life. Good traders have simple lives.'),
	t('Good traders try to avoid losing money. Great traders accept they will lose money.'),
	t('Everyone started somewhere.'),
	t('Plan the trade, see the trade, feel the trade.'),
	t('Plan for the long term.'),
	t('Rule #1 - Don\'t get rugged'),
	t('Always look first. Never rush into a trade or investment blindly.'),
	t('Do your own research, plan ahead, and think for the long term.'),
	t('When in doubt, zoom out.'),
	t('Dips happen.'),
	t('The trend is your friend.'),
	t('There are only three things you can do in markets: 1. Buy 2. Sell 3. Wait.'),
]);

const animationAdvices = (container: HTMLDivElement): void => {
	const last = container.querySelector('.advice.advice-show');
	if (!last) {
		container.querySelector('.advice')?.classList.add('advice-show');
		return;
	}

	const next = last.nextElementSibling;
	last.classList.remove('advice-show');
	last.classList.add('advice-hide');
	if (next) {
		next.classList.remove('advice-hide');
		next.classList.add('advice-show');
	}
	else {
		const current = container.querySelector('.advice');
		if (current) {
			current.classList.remove('advice-hide');
			current.classList.add('advice-show');
		}
	}
};

const getAdvicesSmallHeightClassName = (locale: string): string => {
	const langs = ['zh_CN', 'zh_TW'];

	if (langs.includes(locale)) {
		return 'small';
	}

	return '';
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SaveChangesDialogProps extends DialogProps<DialogSaveChanges> {}

export const SaveChangesDialog = ({ data }: SaveChangesDialogProps): JSX.Element => {
	const { t, i18n } = useTranslation();

	const refContainer = useRef<HTMLDivElement>(null);
	const refAdvices = useRef<HTMLDivElement>(null);

	const [advices, setAdvices] = useState<string[]>(getAdvices(t));
	const [error, setError] = useState<boolean>(false);

	const errorHandler = (value: boolean): void => {
		setError(value);

		if (!refContainer.current) {
			return;
		}

		if (value) {
			refContainer.current.classList.add('error');
		}
		else {
			refContainer.current.classList.remove('error');
		}
	};
	/**
	 * react only to error toggles addressed to this dialog's flow; a concurrent teardown in another
	 * window publishes on the same global subject under a different scope and must be ignored
	 */
	useObservable<SaveChangesErrorState>(windowServiceProxy().saveChangesErrorSubject, (state) => {
		if (state.scopeId === data.scope.id) {
			errorHandler(state.hasError);
		}
	});

	useEffect(() => {
		/**
		 * adding the following inline styles is not necessary on darwin
		 * because the window on darwin is already created with required sizes
		 */
		if (isDarwin()) {
			return;
		}

		if (!refContainer.current) {
			return;
		}

		const { width, height } = getLocaleBasedSaveChangesDialogSize(i18n.language);

		refContainer.current.style.width = `${ width }px`;
		refContainer.current.style.height = `${ height }px`;
	}, [i18n.language]);

	useEffect(() => {
		if (!refAdvices.current) {
			return;
		}

		let animation: NodeJS.Timeout | null = null;
		const animationInterval = 3000;

		if (error && animation) {
			clearInterval(animation);
			animation = null;
			return;
		}

		animationAdvices(refAdvices.current);

		animation = setInterval(() => {
			if (!refAdvices.current) {
				return;
			}

			animationAdvices(refAdvices.current);
		}, animationInterval);

		return () => {
			if (animation) {
				clearInterval(animation);
				animation = null;
			}
		};
	}, [error]);

	useEffect(() => {
		setAdvices(getAdvices(t));
	}, [t]);

	const handleContinueAnyway = (): void => {
		windowServiceProxy().saveChangesDecisionSubject.next({ scopeId: data.scope.id, type: SaveChangesDecisionType.Discard });
	};

	const handleTryAgain = (): void => {
		windowServiceProxy().saveChangesDecisionSubject.next({ scopeId: data.scope.id, type: SaveChangesDecisionType.Retry });
	};

	return (
		<div className={ `save-changes-dialog-container ${ isDarwin() ? 'darwin' : '' }` }>
			<div className={ `dialog save-changes ${ isDarwin() ? 'darwin' : '' }` } ref={ refContainer }>
				<div className='save-changes-info-icon'>
					{ error
						? <ErrorIcon />
						: <CircleProgressbar
							intent={ CircleProgressbarIntent.neutral }
							size={ CircleProgressbarSize.Medium }
						/>
					}
				</div>

				<Typography
					tag='h1'
					name='typography-accent-24px-semibold'
					className='save-changes-dialog-title'
				>
					{ error ? t('Something went wrong') : t('Saving changes...') }
				</Typography>

				{ error
					? <>
						<Typography
							tag='p'
							name='typography-regular-16px'
							className='save-changes-dialog-text error'
						>
							{ t('Check your internet connection and try to save changes again.') }
						</Typography>

						<div className='dialog-buttons save-changes-dialog'>
							<SquareButton
								onClick={ handleContinueAnyway }
								size={ ButtonSize.Small }
								color={ ButtonColor.Gray }
								variant={ ButtonVariant.Secondary }
							>
								{ data.scope.type === SaveChangesScopeType.Group ? t('Close anyway') : t('Quit anyway') }
							</SquareButton>
							<SquareButton
								onClick={ handleTryAgain }
								size={ ButtonSize.Small }
								color={ ButtonColor.Black }
								variant={ ButtonVariant.Primary }
							>
								{ t('Try again') }
							</SquareButton>
						</div>

						<div className='dialog-close-button'>
							<CloseButton
								aria-label='close-save-changes-modal'
								onClick={ () => { windowServiceProxy().saveChangesDecisionSubject.next({ scopeId: data.scope.id, type: SaveChangesDecisionType.Cancel }); } }
								size={ ButtonSize.Medium }
								tabIndex={ -1 }
							/>
						</div>
					</>
					: <div className={ `advices ${ getAdvicesSmallHeightClassName(i18n.language) }` } ref={ refAdvices }>
						{ advices.map((advice) =>
							<Typography
								key={ advice }
								tag='p'
								name='typography-regular-16px'
								className='save-changes-dialog-text advice'
							>
								{ advice }
							</Typography>
						) }
					</div>
				}
			</div>
		</div>
	);
};
