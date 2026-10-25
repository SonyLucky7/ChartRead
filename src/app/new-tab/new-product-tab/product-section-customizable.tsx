import React, { createContext, Ref } from 'react';

import { NewTabCallbackRef } from '../new-product-tab';
import { useContextMenu } from './context-menu';
import { ContextMenuContext } from './context-menu/use-context-menu';
import { ProductContextMenu } from './product-section-customizable/product-context-menu';
import { Products } from './product-section-customizable/products';

import './product-section-customizable.css';

interface ProductSectionCustomizableProps {
	callbackRef: Ref<NewTabCallbackRef>;
}

interface ProductContextMenuContext extends ContextMenuContext {}

export const ProductMenuContext = createContext<ProductContextMenuContext>({});

export const ProductSectionCustomizable = ({ callbackRef }: ProductSectionCustomizableProps): JSX.Element => {
	const {
		contextMenu,
		menuRef,
		setContextMenuData,
		resetContextMenuData,
		currentContextMenuContainer,
		pushContextMenuContainer,
		popContextMenuContainers,
	} = useContextMenu();

	return (
		<>
			<ProductMenuContext.Provider value={ { setContextMenuData, pushContextMenuContainer, popContextMenuContainers } }>
				<Products callbackRef={ callbackRef }/>
			</ProductMenuContext.Provider>

			<ProductContextMenu
				{ ...contextMenu }
				targetContainer={ currentContextMenuContainer?.current }
				onClose={ resetContextMenuData }
				menuRef={ menuRef }
			/>
		</>
	);
};
