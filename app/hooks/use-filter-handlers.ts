import { useCallback } from "react";
import { useUrlSync } from "./use-url-sync";

export function useFilterHandlers() {
    const { searchParams, updateURL, setGlobalFilters, setGlobalSort } = useUrlSync();

    // Handle removing a single filter
    const handleFilterRemove = useCallback((key: string, value: string) => {
        setGlobalFilters(prev => {
            const currentValues = prev[key] ?? [];
            const newValues = currentValues.filter(v => v !== value);
            
            // Update URL asynchronously for sharing
            const newSearchParams = new URLSearchParams(searchParams);
            if (newValues.length > 0) {
                newSearchParams.set(`filter_${key}`, newValues.join(','));
            } else {
                newSearchParams.delete(`filter_${key}`);
            }
            updateURL(newSearchParams);

            return {
                ...prev,
                [key]: newValues
            };
        });
    }, [searchParams, setGlobalFilters, updateURL]);

    // Handle clearing all filters
    const handleClearAllFilters = useCallback(() => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters({});

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        // Remove all filter parameters
        for (const [key] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                newSearchParams.delete(key);
            }
        }

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    }, [searchParams, setGlobalFilters, updateURL]);

    const handleFilterChange = useCallback((key: string, values: string[]) => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters((prev: { [key: string]: string[] }) => ({
            ...prev,
            [key]: values
        }));

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        if (values.length > 0) {
            newSearchParams.set(`filter_${key}`, values.join(','));
        } else {
            newSearchParams.delete(`filter_${key}`);
        }

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    }, [searchParams, setGlobalFilters, updateURL]);

    // Batch filter update function to handle multiple filters at once
    const handleBatchFilterChange = useCallback((filtersToUpdate: { [key: string]: string[] }) => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters(filtersToUpdate);

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        // Apply all filter changes to the same URLSearchParams object
        Object.entries(filtersToUpdate).forEach(([key, values]) => {
            if (values.length > 0) {
                newSearchParams.set(`filter_${key}`, values.join(','));
            } else {
                newSearchParams.delete(`filter_${key}`);
            }
        });

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    }, [searchParams, setGlobalFilters, updateURL]);

    // Handle sort change
    const handleSortChange = useCallback((sort: string) => {
        // Update global state immediately for instant UI feedback
        setGlobalSort(sort);

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('sort', sort);

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    }, [searchParams, setGlobalSort, updateURL]);

    return {
        handleFilterRemove,
        handleClearAllFilters,
        handleFilterChange,
        handleBatchFilterChange,
        handleSortChange
    };
}
