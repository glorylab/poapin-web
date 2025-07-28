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

    // Helper function to update URL for sharing without triggering route reload
    const updateURL = (newSearchParams: URLSearchParams) => {
        const queryString = newSearchParams.toString();
        const newURL = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        
        // Update URL without triggering route reload (for sharing purposes only)
        window.history.replaceState({}, '', newURL);
    };

    // Initialize global state from URL on mount and handle URL changes
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        const urlSort = searchParams.get('sort') || 'collected_newest';

        // Always sync state with URL (for initial load and browser navigation)
        setGlobalFilters(urlFilters);
        setGlobalSort(urlSort);
    }, [searchParams, setGlobalFilters, setGlobalSort]); // Only depend on searchParams and setters

    return {
        searchParams,
        updateURL,
        globalFilters,
        globalSort,
        setGlobalFilters,
        setGlobalSort
    };
}
