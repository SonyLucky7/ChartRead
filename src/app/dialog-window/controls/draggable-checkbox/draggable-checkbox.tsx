import React, { useRef, useState } from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import { Checkbox } from '@tradingview/ui-lib/checkbox';

import { loggerServiceProxy } from '../../../../logger';
import { TabTitlePart } from '../../../../services/settings/tab-title-interfaces';
import { fitInRange } from '../../../../utils/math';
import { DragState } from '../../settings-dialog/tab-settings/tab-title-order-settings';

import './draggable-checkbox.css';

interface DraggableCheckboxProps {
	title: TabTitlePart;
	label: string;
	value: boolean;
	icon: JSX.Element;
	onChange(): void;
	onDrag(dragData: DragState): void;
	onDrop(dropElementTitle: TabTitlePart): void;
	containerBounds?: DOMRect;
	offset?: number;
}

export const DraggableCheckbox = ({
	title,
	label,
	value,
	icon,
	onChange,
	onDrag,
	onDrop,
	containerBounds,
	offset,
}: DraggableCheckboxProps): JSX.Element => {
	const checkboxContainerRef = useRef<HTMLDivElement>(null);

	const [isInDrag, setIsInDrag] = useState<boolean>(false);
	const [innerOffset, setInnerOffset] = useState<number>();
	const [initialBounds, setInitialBounds] = useState<DOMRect>();

	const handleDragStart = (): void => {
		loggerServiceProxy().info('<DraggableCheckbox>.handleDragStart()');

		const draggedElementBounds = checkboxContainerRef.current?.getBoundingClientRect();

		if (!draggedElementBounds) {
			return;
		}

		setIsInDrag(true);
		setInitialBounds(draggedElementBounds);
	};

	const handleDrag = (ev: DraggableEvent): void => {
		if (!initialBounds || !containerBounds || ev.type !== 'mousemove') {
			return;
		}

		const mouseEvent = ev as MouseEvent;

		const currentElementMiddle = initialBounds.height / 2;
		const currentElementY = initialBounds.y + currentElementMiddle;

		const fittedClientY = fitInRange(mouseEvent.clientY, containerBounds.bottom - currentElementMiddle, containerBounds.top + currentElementMiddle);

		setInnerOffset(fittedClientY - currentElementY);

		onDrag({
			title,
			draggedElementRect: initialBounds,
			clientY: mouseEvent.clientY,
		});
	};

	const handleDragEnd = (): void => {
		loggerServiceProxy().info('<DraggableCheckbox>.handleDragEnd()');

		setIsInDrag(false);
		setInnerOffset(undefined);
		setInitialBounds(undefined);

		const draggedElementBounds = checkboxContainerRef.current?.getBoundingClientRect();

		if (!draggedElementBounds || draggedElementBounds.y === initialBounds?.y) {
			return;
		}

		onDrop(title);
	};

	const handleOnChange = (): void => {
		if (isInDrag) {
			return;
		}

		onChange();
	};

	const containerStyle: React.CSSProperties = {
		zIndex: isInDrag ? 1 : 0,
		cursor: isInDrag ? 'grabbing' : 'default',
	};

	if (!isInDrag && typeof offset !== 'undefined') {
		containerStyle.transition = 'transform 0.2s ease-out';
	}

	const shift = isInDrag ? innerOffset : offset;
	if (shift) {
		containerStyle.transform = `translate(0px, ${ shift }px)`;
	}

	return (
		<div className='draggable-checkbox-container' style={ containerStyle } ref={ checkboxContainerRef }>
			<Checkbox
				id={ title }
				checked={ value }
				onChange={ handleOnChange }
				label={ label }
				className='checkbox'
				labelClassName='checkbox-label'
				tabIndex={ 1 }
			/>
			<Draggable
				axis='y'
				bounds={ { top: 0, bottom: 0 } }
				onStart={ handleDragStart }
				onDrag={ handleDrag }
				onStop={ handleDragEnd }
			>
				<div style={ { cursor: isInDrag ? 'grabbing' : 'grab' } }>
					{ icon }
				</div>
			</Draggable>
		</div>
	);
};
