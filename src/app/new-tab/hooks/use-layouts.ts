import { Dispatch, SetStateAction, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { loggerServiceProxy } from '../../../logger';
import { ChartItem, newTabServiceProxy, ResolutionString, SortDirection, SortField } from '../../../services/new-tab';
import { useObservable } from '../../components-ui/hooks';
import { createRegExpList, getTranslatedResolution, rankedSearch } from '../utils/helpers';

export interface Layout extends ChartItem {
	description: string;
}

interface UseLayoutsHook {
	charts: Layout[] | null;
	setCharts: Dispatch<SetStateAction<ChartItem[] | null>>;
	displaySearchValue: string;
	setDisplaySearchValue: Dispatch<SetStateAction<string>>;
	isSearching: boolean;
	setIsSearching: Dispatch<SetStateAction<boolean>>;
	resetSearch(): void;
	sortDirection: SortDirection;
	sortField: SortField;
	handleSortSelect(newSortField: SortField, newSortDirection: SortDirection): void;
	handlerUpdateChartFavorite(id: number, favorite: boolean): void;
}

const SEARCH_DEBOUNCE_TIMEOUT = 300;

function getChartItemIntervalText(interval: ResolutionString): string {
	let result;

	try {
		result = getTranslatedResolution(interval);
	}
	catch (error) {
		result = interval;
	}
	return result;
}

function getSortComparator(sortDirectionValue: SortDirection, sortFieldValue: SortField): (a: ChartItem, b: ChartItem) => number {
	return (a: ChartItem, b: ChartItem): number => {
		if (a.favorite && !b.favorite) {
			return -1;
		}
		if (!a.favorite && b.favorite) {
			return 1;
		}
		const directionValue = sortDirectionValue === SortDirection.Asc ? 1 : -1;
		if (sortFieldValue === SortField.Modified) {
			return directionValue * (a.modified - b.modified);
		}
		return directionValue * a.title.localeCompare(b.title);
	};
}

export function useLayouts(): UseLayoutsHook {
	const [charts, setCharts] = useState<ChartItem[] | null>(null);
	const [searchValue, setSearchValue] = useState<string>('');
	const [displaySearchValue, setDisplaySearchValue] = useState(searchValue);
	const [isSearching, setIsSearching] = useState<boolean>(false);
	const [removedChartIds] = useState<number[]>([]);
	const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Asc);
	const [sortField, setSortField] = useState<SortField>(SortField.Title);

	useLayoutEffect(() => {
		newTabServiceProxy().getSortDirection()
			.then(sortData => {
				setSortField(sortData.sortField);
				setSortDirection(sortData.sortDirection);
			})
			.catch(error =>
				loggerServiceProxy().error(
					'[NewTab.getSortDirection() error]',
					error
				)
			);
	}, []);

	const setLayouts = (): void => {
		newTabServiceProxy().getLayouts()
			.then(({ layouts }) => { setCharts(layouts); })
			.catch((error) => { loggerServiceProxy().error('useCharts.setLayouts(): newTabServiceProxy().getLayouts() error', error); });
	};

	useLayoutEffect(() => {
		setLayouts();
	}, []);

	useObservable(newTabServiceProxy().layoutsEvent, setLayouts);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setSearchValue(displaySearchValue);
		}, SEARCH_DEBOUNCE_TIMEOUT);

		return () => {
			clearTimeout(timeout);
		};
	}, [displaySearchValue]);

	const resetSearch = (): void => {
		setSearchValue('');
		setDisplaySearchValue('');
		setIsSearching(false);
	};

	const chartItems = useMemo(
		() => charts && charts.map((chart: ChartItem) => ({
			...chart,
			description: `${ chart.symbol }, ${ getChartItemIntervalText(chart.interval) }`,
		})),
		[charts]
	);

	const items = useMemo(
		() => chartItems && rankedSearch({
			data: chartItems.filter((chart: ChartItem) => !removedChartIds.includes(chart.id)).sort(getSortComparator(sortDirection, sortField)),
			rules: createRegExpList(searchValue),
			queryString: searchValue,
			primaryKey: 'title',
			secondaryKey: 'description',
		}),
		[chartItems, searchValue, sortDirection, sortField, removedChartIds]
	);

	const handleSortSelect = useCallback((newSortField: SortField, newSortDirection: SortDirection): void => {
		newTabServiceProxy().saveSortDirection({ sortField: newSortField, sortDirection: newSortDirection });
		setSortField(newSortField);
		setSortDirection(newSortDirection);
	}, []);

	const handlerUpdateChartFavorite = useCallback((id: number, favorite: boolean): void => {
		if (charts) {
			setCharts(charts.map(chart => {
				if (chart.id === id) {
					chart.favorite = favorite;
					return chart;
				}
				return chart;
			}));
		}
	}, [items]);

	return {
		charts: items,
		setCharts,
		displaySearchValue,
		setDisplaySearchValue,
		isSearching,
		setIsSearching,
		resetSearch,
		sortDirection,
		sortField,
		handleSortSelect,
		handlerUpdateChartFavorite,
	};
}
