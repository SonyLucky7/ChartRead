import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';

import { CopyLayoutModal } from '../../copy-layout-modal';
import { DeleteLayoutModal } from '../../delete-layout-modal';
import { useContextMenu } from '../context-menu';
import { ContextMenuContext } from '../context-menu/use-context-menu';
import { CreateLayoutModal } from './create-layout-modal';
import { GoProModal } from './go-pro-modal';
import { LayoutContextMenu } from './layout-context-menu';
import { Layouts } from './layouts';
import { SignUpModal } from './sign-up-modal';

interface LayoutInfo {
	layoutName: string;
	layoutId: string;
	isFavourite: boolean;
}

interface LayoutContextMenuContext extends ContextMenuContext {
	setSelectedLayout?: Dispatch<SetStateAction<LayoutInfo>>;
}

const initialLayoutInfo: LayoutInfo = {
	layoutName: '',
	layoutId: '',
	isFavourite: false,
};

export const LayoutMenuContext = React.createContext<LayoutContextMenuContext>({});

export const LayoutSection = (): JSX.Element => {
	const [isCreateLayoutOpened, setIsCreateLayoutOpened] = useState<boolean>(false);
	const [isCopyLayoutOpened, setIsCopyLayoutOpened] = useState<boolean>(false);
	const [isDeleteLayoutOpened, setIsDeleteLayoutOpened] = useState<boolean>(false);
	const [selectedLayout, setSelectedLayout] = useState<LayoutInfo>(initialLayoutInfo);

	const [isGoProOpened, setIsGoProOpened] = useState<boolean>(false);
	const [isSignUpOpened, setIsSignUpOpened] = useState<boolean>(false);

	const {
		contextMenu,
		menuRef,
		setContextMenuData,
		resetContextMenuData,
		currentContextMenuContainer,
		pushContextMenuContainer,
		popContextMenuContainers,
	} = useContextMenu();

	const resetSelectedLayoutState = (): void => {
		setSelectedLayout(initialLayoutInfo);
	};

	const handleCopyLayout = useCallback(() => {
		resetContextMenuData();
		setIsCopyLayoutOpened(true);
	}, [resetContextMenuData]);

	const handleDeleteLayout = useCallback(() => {
		resetContextMenuData();
		setIsDeleteLayoutOpened(true);
	}, [resetContextMenuData]);

	const handleOpenCreateLayoutModal = useCallback(() => {
		setIsCreateLayoutOpened(true);
	}, []);

	const handleOpenSignUpModal = useCallback(() => {
		setIsSignUpOpened(true);
	}, []);

	return (
		<>
			<LayoutMenuContext.Provider value={ { setContextMenuData, setSelectedLayout, pushContextMenuContainer, popContextMenuContainers } }>
				<Layouts
					openCreateLayoutModal={ handleOpenCreateLayoutModal }
					openSignUpModal={ handleOpenSignUpModal }
				/>
			</LayoutMenuContext.Provider>

			<LayoutContextMenu
				{ ...contextMenu }
				menuRef={ menuRef }
				targetContainer={ currentContextMenuContainer?.current }
				onCopyLayout={ handleCopyLayout }
				onDeleteLayout={ handleDeleteLayout }
				onSignUpModalOpen={ handleOpenSignUpModal }
				onClose={ resetContextMenuData }
			/>

			<CreateLayoutModal
				isOpened={ isCreateLayoutOpened }
				onCancel={ () => { setIsCreateLayoutOpened(false); } }
				openGoProModal={ () => { setIsGoProOpened(true); } }
			/>
			<CopyLayoutModal
				isOpened={ isCopyLayoutOpened }
				layoutName={ selectedLayout.layoutName }
				layoutId={ selectedLayout.layoutId }
				isFavorite={ selectedLayout.isFavourite }
				onCancel={ () => {
					setIsCopyLayoutOpened(false);
					resetSelectedLayoutState();
				} }
				openGoPro={ () => { setIsGoProOpened(true); } }
			/>
			<DeleteLayoutModal
				isOpened={ isDeleteLayoutOpened }
				layoutName={ selectedLayout.layoutName }
				layoutId={ selectedLayout.layoutId }
				onCancel={ () => {
					setIsDeleteLayoutOpened(false);
					resetSelectedLayoutState();
				} }
			/>

			<GoProModal
				isOpened={ isGoProOpened }
				onCancel={ () => { setIsGoProOpened(false); } }
			/>

			<SignUpModal
				isOpened={ isSignUpOpened }
				onCancel={ () => { setIsSignUpOpened(false); } }
			/>
		</>
	);
};
