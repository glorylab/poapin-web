import { useEffect } from "react";
import { useSearchParams } from "@remix-run/react";
import { useAtom } from 'jotai';
import { filterStateAtom, sortStateAtom } from '~/atoms/filter-atoms';

export function useUrlSync() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [globalFilters, setGlobalFilters] = useAtom(filterStateAtom);
    const [globalSort, setGlobalSort] = useAtom(sortStateAtom);

    // Get filter state from URL search params
    const getFiltersFromURL = (): { [key: string]: string[] } => {
        const filters: { [key: string]: string[] } = {};
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const filterKey = key.replace('filter_', '');
                filters[filterKey] = value.split(',').filter(v => v.trim() !== '');
            }
        }
        return filters;
    };

    // Helper function to update URL without trailing '?' when no parameters
    const updateURL = (searchParams: URLSearchParams) => {
        const queryString = searchParams.toString();
        const newURL = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    };

    // Sync global state with URL on mount and URL changes
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        const urlSort = searchParams.get('sort') || 'collected_newest';

        // Only update global state if URL has different values (to avoid infinite loops)
        const filtersChanged = JSON.stringify(urlFilters) !== JSON.stringify(globalFilters);
        const sortChanged = urlSort !== globalSort;

        if (filtersChanged) {
            setGlobalFilters(urlFilters);
        }
        if (sortChanged) {
            setGlobalSort(urlSort);
        }
    }, [searchParams, globalFilters, globalSort, setGlobalFilters, setGlobalSort]);

    return {
        searchParams,
        updateURL,
        globalFilters,
        globalSort,
        setGlobalFilters,
        setGlobalSort
    };
}
