import React, { ComponentProps } from 'react';
import { Typography } from '@tradingview/ui-lib/typography';

import { Theme, ThemeOption as ThemeOptionType } from '../../../services/settings/theme';
import { getArrowKeyboardNavigationDataAttributes } from '../../common/arrow-keyboard-navigation-data-attributes';

import './theme-option.css';

export const enum ThemeOptionSize {
	Small = 'small',
	Medium = 'medium',
	Large = 'large',
	Relative = 'relative',
}

interface ThemeOptionProps {
	onClick(theme: Theme): void;
	theme: ThemeOptionType;
	isActive: boolean;
	showLabel?: boolean;
	size?: ThemeOptionSize;
	tabIndex?: number;
}

const themeLabelStyles = new Map<ThemeOptionSize, ComponentProps<typeof Typography>['name']>([
	[ThemeOptionSize.Small, 'typography-regular-13px'],
	[ThemeOptionSize.Medium, 'typography-regular-14px'],
	[ThemeOptionSize.Large, 'typography-accent-16px-semibold'],
]);

export const ThemeOption = ({ onClick, theme, isActive, showLabel = true, size = ThemeOptionSize.Medium, tabIndex }: ThemeOptionProps): JSX.Element =>
	<button
		{ ...getArrowKeyboardNavigationDataAttributes(true) }
		onClick={ () => { onClick(theme.id); } }
		className={ `theme-option ${ size } ${ isActive ? 'active' : '' } ${ tabIndex && tabIndex < 0 ? 'no-focus-outline' : '' }` }
		tabIndex={ tabIndex }
	>
		<div className={ `theme-option-icon ${ theme.id }` }>
			{ theme.id === 'system' &&
				<>
					<div className='dark' />
					<div className='light' />
				</>
			}
			{ isActive && <div className='theme-option-icon-active-inner-outline' /> }
		</div>
		{ showLabel &&
			<Typography
				tag='span'
				name={ themeLabelStyles.get(size) ?? 'typography-regular-14px' }
			>
				{ theme.label }
			</Typography>
		}
	</button>;
