import '../../../../../utils/array';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { svgIcondragSize18pxDirectionVertical as dragSvgIcon } from '@tradingview/ui-lib/icons/monochrome/drag/size_18px__direction_vertical';

import { settingsProviderProxy } from '../../../../../services/settings';
import { TabTitlePart, tabTitlePartWithTranslation, TabTitleState } from '../../../../../services/settings/tab-title-interfaces';
import { KeyboardEventKey } from '../../../../../utils';
import { fitInRange } from '../../../../../utils/math';
import { moveTab, resetTabsOffset } from '../../../../common/move-tab';
import { useObservable } from '../../../../components-ui/hooks/use-observable';
import { Icon } from '../../../../components-ui/icon';
import { DraggableCheckbox } from '../../../controls/draggable-checkbox';
import { SettingsSection } from '../../settings-section';

import './tab-title-order-settings.css';

export type DragState = {
	draggedElementRect: DOMRect;
	clientY: number;
	title: TabTitlePart;
}

export const TabTitleOrderSettings = (): JSX.Element => {
	const { t } = useTranslation();

	const containerRef = useRef<HTMLDivElement>(null);

	const [tabSettingsState, setTabSettingsState] = useState<TabTitleState[]>([]);
	const [lastInsertPosition, setLastInsertPosition] = useState<number>();

	const changeValue = useCallback((id: TabTitlePart, value: boolean): void => {
		if (tabSettingsState.length === 0) {
			return;
		}

		const tabSettings = tabSettingsState.map((tabSetting) => {
			if (tabSetting.id === id) {
				return { id, isVisible: value };
			}

			return tabSetting;
		});

		settingsProviderProxy().tabChange.next(tabSettings);
	}, [tabSettingsState]);

	useEffect(() => {
		const keyDownHandler = (ev: KeyboardEvent): void => {
			if (
				ev.code !== KeyboardEventKey.Enter ||
				!(ev.target instanceof HTMLInputElement)
			) {
				return;
			}

			const { id } = ev.target;
			const element = tabSettingsState.find((tabSetting) => tabSetting.id === id);

			if (!element) {
				return;
			}

			changeValue(element.id, !element.isVisible);
		};

		document.addEventListener('keydown', keyDownHandler);

		return () => {
			document.removeEventListener('keydown', keyDownHandler);
		};
	}, [changeValue, tabSettingsState]);

	useObservable(settingsProviderProxy().tabChange, setTabSettingsState);

	const currentInsertPosition = (clientY: number, elementOffset: number): number => {
		const containerBounds = containerRef?.current?.getBoundingClientRect();
		if (!containerBounds) {
			return -1;
		}

		const maxIndex = containerBounds.height / elementOffset;
		const top = containerBounds.top;
		const off = clientY - top - elementOffset / 2;
		const index = Math.round(off / elementOffset);

		return fitInRange(index, maxIndex, 0);
	};

	const handleDrag = useCallback((dragData: DragState): void => {
		if (tabSettingsState.length === 0) {
			return;
		}

		const elementOffset = dragData.draggedElementRect.height;
		const elementGap = 8;
		const tabIndex = currentInsertPosition(dragData.clientY, elementOffset + elementGap);

		const newTabSettingsState = moveTab(dragData.title, elementOffset + elementGap, tabIndex, tabSettingsState);

		if (!newTabSettingsState) {
			return;
		}

		setTabSettingsState(newTabSettingsState.tabState as TabTitleState[]);
		setLastInsertPosition(newTabSettingsState.holeIndex);
	}, [tabSettingsState]);

	const handleDrop = useCallback((dropElementTitle: TabTitlePart): void => {
		if (tabSettingsState.length === 0) {
			return;
		}
		const tabSettingsStateSnapshot = [...tabSettingsState];

		const index = tabSettingsStateSnapshot.findIndex(tabData => tabData.id === dropElementTitle);

		if (index === lastInsertPosition || typeof lastInsertPosition === 'undefined') {
			return;
		}

		settingsProviderProxy().tabChange.next(tabSettingsStateSnapshot.move(index, lastInsertPosition));
		setTabSettingsState(resetTabsOffset(tabSettingsStateSnapshot) as TabTitleState[]);
	}, [lastInsertPosition, tabSettingsState]);

	return (
		<SettingsSection
			label={ t('TAB TITLE (DRAG TO REORDER)') }
			className='tab-title-order'
			contentRef={ containerRef }
		>
			{ tabSettingsState.map((tabSetting) => {
				const translatedLabel = tabTitlePartWithTranslation.get(tabSetting.id);

				return (
					<React.Fragment key={ tabSetting.id }>
						{ translatedLabel &&
							<DraggableCheckbox
								key={ tabSetting.id }
								label={ translatedLabel() }
								title={ tabSetting.id }
								value={ tabSetting.isVisible }
								onChange={ () => { changeValue(tabSetting.id, !tabSetting.isVisible); } }
								icon={ <Icon icon={ dragSvgIcon } /> }
								onDrag={ handleDrag }
								onDrop={ handleDrop }
								offset={ tabSetting.offset }
								containerBounds={ containerRef.current?.getBoundingClientRect() }
							/>
						}
					</React.Fragment>
				);
			}) }
		</SettingsSection>
	);
};
