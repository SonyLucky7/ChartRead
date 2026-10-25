import React from 'react';

import { IpcServices } from '../../ipc-services';
import { MouseButton } from '../../native/hardware';
import { windowServiceProxy } from '../../services/window';
import { isDarwin } from '../../utils';
import { useI18n, useObservable, useTokyoNight } from '../components-ui/hooks';
import { useLocalTabTitleTranslation } from '../components-ui/hooks/use-local-tab-title-translation';
import { LayoutSection } from './new-product-tab/layout-section';
import { ProductSectionCustomizable } from './new-product-tab/product-section-customizable';
import { Separator } from './new-product-tab/separator';
import { SidedActionsLeft } from './new-product-tab/sided-actions-left';
import { SidedActionsRight } from './new-product-tab/sided-actions-right';

import TokyoFilter from '../assets/tokyo-filter.svg';

import './new-product-tab.css';

IpcServices.initializeRpc();

export interface NewTabCallbackRef {
	openDrawer(): void;
}

export const COUNT_LIMIT = 'count_limit';

export function isOpenPageInNewTab(ev: React.MouseEvent): boolean {
	const isCtrlPressed = isDarwin() ? ev.metaKey : ev.ctrlKey;
	const isMiddleClick = ev.button === 1;

	return isMiddleClick || isCtrlPressed;
}

export const preventScrollOnMiddleClick = (ev: React.MouseEvent): void => {
	if (isDarwin() || ev.button !== MouseButton.Middle) {
		return;
	}

	ev.preventDefault();
};

const tokyoNightHandler = (isTokyoNightOn: boolean): void => {
	const tokyoNightClassname = 'tokyo-night';

	if (isTokyoNightOn) {
		document.body.classList.add(tokyoNightClassname);
		return;
	}

	document.body.classList.remove(tokyoNightClassname);
};

export const NewProductTab = (): JSX.Element => {
	const { t, i18n } = useI18n(document.documentElement);

	const productSectionCallbackRef = React.useRef<NewTabCallbackRef>(null);

	useLocalTabTitleTranslation(i18n, t('New tab'));

	useObservable<boolean>(windowServiceProxy().tokyoNightSubject, tokyoNightHandler);

	const { isTokyoNightOn } = useTokyoNight();

	return (
		<>
			{ isTokyoNightOn && <div style={ { display: 'none' } }><TokyoFilter/></div> }
			<div className='new-product-tab'>
				<LayoutSection />
				<Separator />
				<ProductSectionCustomizable callbackRef={ productSectionCallbackRef } />

				<SidedActionsLeft />
				<SidedActionsRight
					onProductDrawerButtonClick={ () => { productSectionCallbackRef.current?.openDrawer(); } }
				/>
			</div>
		</>
	);
};
