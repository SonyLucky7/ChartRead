import React, { CSSProperties, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonColor, ButtonSize, ButtonVariant, SquareButton } from '@tradingview/ui-lib/buttons/square-button';
import { Typography } from '@tradingview/ui-lib/typography';

import { useTheme } from '../hooks';

import './hint-referenceable.css';

interface HintReferenceableProps {
	children: React.ReactNode;
	isShown: boolean;
	onAccept(): void;
	text: string;
	position: HintReferenceablePosition;
	alignment?: HintReferenceableAlignment;
	className?: string;
}

export const enum HintReferenceablePosition {
	Left = 'left',
	Top = 'top',
	Right = 'right',
	Bottom = 'bottom',
}

export const enum HintReferenceableAlignment {
	Center = 'center',
	End = 'end',
}

export const HintReferenceable = ({
	children,
	isShown,
	onAccept,
	text,
	position,
	alignment = HintReferenceableAlignment.Center,
	className = '',
}: HintReferenceableProps): JSX.Element => {
	const { t } = useTranslation();

	const childrenRef = React.useRef<HTMLDivElement>(null);
	const hintRef = React.useRef<HTMLDivElement>(null);

	const [hintStyle, setHintStyle] = useState<CSSProperties>({});

	const { isDarkTheme } = useTheme();

	useEffect(() => {
		if (!isShown) {
			return;
		}

		const timer = setTimeout(() => {
			if (childrenRef.current === null || hintRef.current === null) {
				return;
			}

			const tooltipOffset = 5;

			const { width, height } = childrenRef.current.getBoundingClientRect();

			switch (position) {
				case HintReferenceablePosition.Left: {
					if (alignment === HintReferenceableAlignment.End) {
						setHintStyle({
							'right': `${ width + tooltipOffset }px`,
							'bottom': '0px',
							// eslint-disable-next-line @typescript-eslint/naming-convention
							'--hint-referenceable-anchor-half-height': `${ height / 2 }px`,
						} as CSSProperties);
					}
					else {
						setHintStyle({
							right: `${ width + tooltipOffset }px`,
							top: `${ height / 2 - hintRef.current.getBoundingClientRect().height / 2 }px`,
						});
					}
					break;
				}
				case HintReferenceablePosition.Top: {
					setHintStyle({
						left: `${ width / 2 - hintRef.current.getBoundingClientRect().width / 2 }px`,
						bottom: `${ height + tooltipOffset }px`,
					});
					break;
				}
				case HintReferenceablePosition.Right: {
					if (alignment === HintReferenceableAlignment.End) {
						setHintStyle({
							'left': `${ width + tooltipOffset }px`,
							'bottom': '0px',
							// eslint-disable-next-line @typescript-eslint/naming-convention
							'--hint-referenceable-anchor-half-height': `${ height / 2 }px`,
						} as CSSProperties);
					}
					else {
						setHintStyle({
							left: `${ width + tooltipOffset }px`,
							top: `${ height / 2 - hintRef.current.getBoundingClientRect().height / 2 }px`,
						});
					}
					break;
				}
				case HintReferenceablePosition.Bottom: {
					setHintStyle({
						left: `${ width / 2 - hintRef.current.getBoundingClientRect().width / 2 }px`,
						top: `${ height + tooltipOffset }px`,
					});
					break;
				}
				default: {
					setHintStyle({ top: 'auto' });
				}
			}

			setHintStyle((prevState) => ({ ...prevState, visibility: 'visible' }));
		}, 100);

		return () => {
			clearTimeout(timer);
		};
	}, [isShown, position, alignment]);

	if (!isShown) {
		return <>{ children }</>;
	}

	return (
		<div className={ `wrapper-hint-referenceable ${ position } align-${ alignment }` }>
			<div ref={ childrenRef } className='hint-referenceable-children-container'>
				{ children }
			</div>

			<div
				ref={ hintRef }
				className={ `hint-referenceable ${ className }` }
				style={ hintStyle }
			>
				<Typography
					tag='div'
					name='typography-regular-14px'
					className='hint-referenceable-text'
				>
					{ text }
				</Typography>
				<SquareButton
					size={ ButtonSize.XSmall }
					variant={ ButtonVariant.Primary }
					color={ isDarkTheme ? ButtonColor.Black : ButtonColor.Gray }
					onClick={ onAccept }
					className='hint-referenceable-button'
				>
					{ t('Got it') }
				</SquareButton>
				<div className='hint-referenceable-arrow' />
			</div>
		</div>
	);
};
