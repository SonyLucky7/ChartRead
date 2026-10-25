import React, { useRef } from 'react';
import { ButtonSize, CloseButton } from '@tradingview/ui-lib/buttons/close-button';

import { useFocusLock, useOutsideClick, useTokyoNight } from '../hooks';

import TokyoFilter from '../../assets/tokyo-filter.svg';

import './modal-window.css';

interface ModalWindowProps {
	children: React.ReactNode;
	onCancel(): void;
	className?: string;
	isClosable?: boolean;
	modalRef?: React.RefObject<HTMLDivElement>;
}

export const MODAL_WINDOW_CLASSNAME = 'modal-window';

export const ModalWindow = ({
	onCancel,
	children,
	className = '',
	isClosable = true,
	modalRef,
}: ModalWindowProps): JSX.Element => {
	const innerRef = useRef<HTMLDivElement>(null);
	const ref = modalRef ?? innerRef;

	useOutsideClick<HTMLDivElement>(
		ref,
		true,
		onCancel,
		{
			escape: true,
		},
	);

	useFocusLock<HTMLDivElement>(ref);

	const { isTokyoNightOn } = useTokyoNight();

	return (
		<div className='modal-window-container'>
			{ isTokyoNightOn && <div style={ { display: 'none' } }><TokyoFilter /></div> }

			<div className={ `${ MODAL_WINDOW_CLASSNAME } ${ className }` } ref={ ref } tabIndex={ -1 }>
				{ children }

				{ isClosable &&
					<div className='modal-window-close-button'>
						<CloseButton
							aria-label='close-modal-window'
							onClick={ onCancel }
							size={ ButtonSize.Medium }
							tabIndex={ 99 }
						/>
					</div>
				}
			</div>
		</div>
	);
};
