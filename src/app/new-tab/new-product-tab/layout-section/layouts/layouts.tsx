import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@tradingview/ui-lib/typography';

import { RendererServiceData } from '../../../../../services/window/window-api';
import { getRendererInitialData } from '../../../../common/app-common';
import { Spinner } from '../../../../spinner';
import { useLayouts } from '../../../hooks';
import { Layout } from '../../../hooks/use-layouts';
import { reEscape } from '../../../utils/helpers';
import { LayoutMenuContext } from '../layout-section';
import { CreateNewLayoutButton } from './create-new-layout-button';
import { EmptySearchResult } from './empty-search-results';
import { ExpandOrCollapseLayoutsButton } from './expand-or-collapse-layouts-button';
import { NewTabTextInput } from './input';
import { Layout as LayoutComponent } from './layout';
import { OpenDefaultChartButton } from './open-default-chart-button';
import { SortLayoutsButton } from './sort-layouts-button';

import './layouts.css';

interface LayoutsProps {
	openCreateLayoutModal(): void;
	openSignUpModal(): void;
}

const enum LayoutsExpandedStyle {
	Folded = '',
	HalfExpanded = 'half-expanded',
	Expanded = 'expanded',
}

const LAYOUTS_WITHOUT_EXPAND_BUTTON_COUNT = 3;

function getLayoutsFiltered(layouts: Layout[] | null, isLayoutsExpanded: boolean, isSearching: boolean): Layout[] {
	if (!layouts) {
		return [];
	}

	if (isLayoutsExpanded) {
		return layouts;
	}

	const layoutsNumberToShow = isSearching ? LAYOUTS_WITHOUT_EXPAND_BUTTON_COUNT + 1 : LAYOUTS_WITHOUT_EXPAND_BUTTON_COUNT;

	return layouts.slice(0, layoutsNumberToShow);
}

function getLayoutTextHighlighted(text: string, searchValue: string): JSX.Element {
	const parts = text.split(new RegExp(`(${ reEscape(searchValue) })`, 'gi'));

	return (
		<>
			{ parts
				.filter(Boolean)
				.map((part, index) =>
					<span
						key={ `${ part }_${ index }` }
						className={ `${ part.toLocaleLowerCase() === searchValue.toLocaleLowerCase() ? 'highlighted' : '' }` }
					>
						{ part }
					</span>
				) }
		</>
	);
}

export const Layouts = ({ openCreateLayoutModal, openSignUpModal }: LayoutsProps): JSX.Element => {
	const { t } = useTranslation();

	const { pushContextMenuContainer, popContextMenuContainers } = useContext(LayoutMenuContext);

	const layoutsRef = useRef<HTMLDivElement>(null);
	const layoutListRef = useRef<HTMLUListElement>(null);

	const [rendererData, setRendererData] = useState<RendererServiceData>();

	const [isLayoutsExpanded, setIsLayoutsExpanded] = useState<boolean>(false);
	const [layoutsExpandedStyle, setLayoutsExpandedStyle] = useState<LayoutsExpandedStyle>(LayoutsExpandedStyle.Folded);

	useLayoutEffect(() => {
		setRendererData(
			getRendererInitialData<RendererServiceData>()
		);
	}, []);

	useEffect(() => {
		pushContextMenuContainer?.(layoutsRef);

		return () => {
			popContextMenuContainers?.();
		};
	}, [popContextMenuContainers, pushContextMenuContainer]);

	const {
		charts: layouts,
		isSearching,
		setIsSearching,
		sortDirection,
		sortField,
		displaySearchValue,
		setDisplaySearchValue,
		resetSearch,
		handleSortSelect,
		handlerUpdateChartFavorite,
	} = useLayouts();

	const toggleLayoutsExpanded = (): void => {
		setIsLayoutsExpanded((prevState) => {
			const newState = !prevState;

			if (!layouts) {
				return newState;
			}

			if (newState) {
				const layoutsHalfExpandedCount = 8;

				if (layouts?.length < (isSearching ? layoutsHalfExpandedCount + 1 : layoutsHalfExpandedCount)) {
					setLayoutsExpandedStyle(LayoutsExpandedStyle.HalfExpanded);
				}
				else {
					setLayoutsExpandedStyle(LayoutsExpandedStyle.Expanded);
				}

				requestAnimationFrame(() => {
					if (layoutListRef.current) {
						layoutListRef.current.scrollTo(0, 0);
					}
				});
			}
			else {
				setLayoutsExpandedStyle(LayoutsExpandedStyle.Folded);
			}

			return newState;
		});
	};

	// eslint-disable-next-line @typescript-eslint/no-extra-parens
	const showCreateNewChartButton = (rendererData?.userId && !isSearching) || !rendererData?.userId;
	const showEmptySearchResult = Boolean(rendererData?.userId && displaySearchValue && Array.isArray(layouts) && layouts.length === 0);
	const layoutLimitToShowExpandButton = isSearching ? LAYOUTS_WITHOUT_EXPAND_BUTTON_COUNT + 1 : LAYOUTS_WITHOUT_EXPAND_BUTTON_COUNT;
	const showExpandLayoutsButton = !showEmptySearchResult && layouts && (isLayoutsExpanded || layouts.length > layoutLimitToShowExpandButton);

	return (
		<section className='layouts' ref={ layoutsRef }>
			<div className='layouts-header'>
				<Typography
					tag='h2'
					name='typography-accent-adaptive-2xs-semibold-desktop'
					className='layouts-title'
				>
					{ isSearching ? t('Search results') : t('Supercharts') }
				</Typography>

				<div className='layouts-controls'>
					<NewTabTextInput
						value={ displaySearchValue }
						onChange={ ({ target: { value } }) => { setDisplaySearchValue(value); } }
						onBlur={ () => {
							if (!displaySearchValue) {
								setIsSearching(false);
							}
						} }
						onClear={ resetSearch }
						onFocus={ () => { setIsSearching(true); } }
					/>

					<SortLayoutsButton
						sortDirection={ sortDirection }
						sortField={ sortField }
						handleSortSelect={ handleSortSelect }
					/>
				</div>
			</div>

			<ul
				className={ `layout-list ${ layoutsExpandedStyle } ${ showEmptySearchResult ? 'empty' : '' }` }
				ref={ layoutListRef }
			>
				{ !rendererData?.userId && <OpenDefaultChartButton tabId={ rendererData?.tabId } /> }

				{ rendererData?.userId && !layouts && <Spinner /> }
				{ showEmptySearchResult && <EmptySearchResult onClick={ resetSearch } /> }
				{ showCreateNewChartButton &&
					<CreateNewLayoutButton
						openCreateLayoutModal={ openCreateLayoutModal }
						openSignUpModal={ openSignUpModal }
					/>
				}
				{ layouts &&
					getLayoutsFiltered(layouts, isLayoutsExpanded, isSearching)
						.map((layout) =>
							<LayoutComponent
								{ ...layout }
								key={ layout.url }
								displayTitle={ displaySearchValue ? getLayoutTextHighlighted(layout.title, displaySearchValue) : layout.title }
								description={ displaySearchValue ? getLayoutTextHighlighted(layout.description, displaySearchValue) : layout.description }
								onFavouriteClick={ handlerUpdateChartFavorite }
							/>
						)
				}
			</ul>

			<div className='layouts-expand-button-container'>
				{ showExpandLayoutsButton &&
					<ExpandOrCollapseLayoutsButton
						onClick={ toggleLayoutsExpanded }
						isLayoutsExpanded={ isLayoutsExpanded }
						// eslint-disable-next-line @typescript-eslint/no-extra-parens
						isSearching={ Boolean((isSearching && displaySearchValue) || displaySearchValue) }
						layoutCount={ layouts.length }
					/>
				}
			</div>
		</section>
	);
};
