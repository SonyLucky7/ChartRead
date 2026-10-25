import React, { useCallback, useRef, useState } from 'react';
import { ControlIntent, ControlSize } from '@tradingview/ui-lib/controls/control-skeleton/types';
import { Input } from '@tradingview/ui-lib/controls/input';
import { Label } from '@tradingview/ui-lib/controls/label';
import { Icon } from '@tradingview/ui-lib/icon';
import { svgIconcrossWebSize18pxStroke1px as crossSvgIcon } from '@tradingview/ui-lib/icons/monochrome/cross-web/size_18px__stroke_1px';
import { svgIconexclamationSize28pxStroke1px as exclamationMarkSvgIcon } from '@tradingview/ui-lib/icons/monochrome/exclamation/size_28px__stroke_1px';
import { svgIconeyeSize28pxStroke1pxTypeEye as eyeSvgIcon } from '@tradingview/ui-lib/icons/monochrome/eye/size_28px__stroke_1px__type_eye';
import { svgIconeyeSize28pxStroke1pxTypeEyeCrossed as eyeCrossedSvgIcon } from '@tradingview/ui-lib/icons/monochrome/eye/size_28px__stroke_1px__type_eye-crossed';

import { isRtlRender } from '../../../utils';

import './text-input.css';

interface TextInputProps {
	value: string;
	onChange(ev: React.ChangeEvent<HTMLInputElement>): void;
	id?: string;
	allowClear?: boolean;
	allowShowPasswordWhenDisabled?: boolean;
	autoFocus?: boolean;
	className?: string;
	disabled?: boolean;
	errorMessage?: string;
	inputRef?: React.RefObject<HTMLInputElement>;
	label?: string;
	maxLength?: number;
	name?: string;
	onClear?(): void;
	onFocus?: React.FocusEventHandler<HTMLInputElement>;
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
	placeholder?: string;
	size?: ControlSize;
	startSlot?: React.ReactNode;
	tabIndex?: number;
	type?: 'text' | 'password';
	valid?: boolean;
}

interface InputStyle {
	paddingLeft?: string;
	paddingRight?: string;
}

function getEndAdornmentMargin(size: ControlSize): number {
	const margins: Partial<Record<ControlSize, number>> = {
		[ControlSize.Small]: 4,
		[ControlSize.Medium]: 11,
	};

	return margins[size] ?? 0;
}

export const TextInput = ({
	value,
	onChange,
	id,
	allowClear = false,
	allowShowPasswordWhenDisabled = false,
	autoFocus = false,
	className = '',
	disabled = false,
	errorMessage,
	inputRef,
	label,
	maxLength,
	name,
	onClear,
	onFocus,
	onBlur,
	placeholder,
	size = ControlSize.Small,
	startSlot,
	tabIndex,
	type = 'text',
	valid = true,
}: TextInputProps): JSX.Element => {
	const innerRef = useRef<HTMLInputElement>(null);
	const ref = inputRef ?? innerRef;

	const [showPassword, setShowPassword] = useState<boolean>(false);

	const [inputStyle, setInputStyle] = useState<InputStyle>({});

	const isFocused = document.activeElement === ref.current;

	const endAdornmentRef = useCallback((node: HTMLDivElement) => {
		if (!node) {
			return;
		}

		const endAdornmentWidth = Math.round(node.getBoundingClientRect().width);
		const endAdornmentMargin = getEndAdornmentMargin(size);

		const paddingDir = isRtlRender() ? 'paddingLeft' : 'paddingRight';

		setInputStyle({ [paddingDir]: `${ endAdornmentWidth + endAdornmentMargin }px` });
	/**
	 * isFocused is required as a dependency to recalculate the padding when
	 * an conditional end adornment may appear: like clear input icon
	 */
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [size, isFocused]);

	const handlePasswordIconClick = (): void => {
		if (disabled && !allowShowPasswordWhenDisabled) {
			return;
		}

		setShowPassword((prevState) => !prevState);
	};

	const hasEndAdornment = allowClear || type === 'password' || !valid;

	const showClear = allowClear && (isFocused || !!value);

	return (
		<div className={ `text-input-wrapper ${ className }` }>
			{ label && <Label htmlFor={ id }>{ label }</Label> }

			<div
				className={ `text-input-container ${ className }` }
				title={ errorMessage }
			>
				<Input
					id={ id }
					value={ value }
					onChange={ onChange }
					autoFocus={ autoFocus }
					className={ `text-input ${ className }` }
					disabled={ disabled }
					intent={ valid ? ControlIntent.Default : ControlIntent.Danger }
					maxLength={ maxLength }
					name={ name }
					onFocus={ onFocus }
					onBlur={ onBlur }
					reference={ ref }
					startSlot={ startSlot }
					placeholder={ placeholder }
					size={ size }
					style={ inputStyle }
					tabIndex={ tabIndex }
					type={ `${ type === 'password' && !showPassword ? 'password' : 'text' }` }
				/>

				{ hasEndAdornment &&
					<div className={ `text-input-end-adornment ${ size }` } ref={ endAdornmentRef }>
						{ !valid &&
							<Icon
								icon={ exclamationMarkSvgIcon }
								className='ui-lib-icon text-input-error-icon'
								title={ errorMessage }
							/>
						}
						{ showClear &&
							<Icon icon={ crossSvgIcon } onClick={ onClear } className='ui-lib-icon text-input-clear-icon' />
						}
						{ type === 'password' &&
							<Icon
								icon={ showPassword ? eyeCrossedSvgIcon : eyeSvgIcon }
								onClick={ handlePasswordIconClick }
								className='ui-lib-icon text-input-password-icon'
							/>
						}
					</div>
				}
			</div>
		</div>
	);
};
