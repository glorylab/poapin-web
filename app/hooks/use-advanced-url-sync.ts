import { useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from '@remix-run/react';
import { useAtom } from 'jotai';
import {
    filtersAtom,
    sortAtom,
    timeCapsuleModeAtom,
    urlParamsAtom,
    shouldSyncToUrlAtom,
    FilterState,
    SortState,
    DEFAULT_SORT,
    DEFAULT_FILTERS
} from '~/atoms/poap-state';

/**
 * Advanced URL Sync Hook
 * 
 * Handles bidirectional sync between URL search params and Jotai atoms
 * Priority: URL params > Atom state > Default values
 * 
 * Features:
 * 1. On mount: URL → Atoms (restore from URL)
 * 2. On atom change: Atoms → URL (sync to URL for sharing)
 * 3. Cross-tab persistence via sessionStorage (atomWithStorage)
 * 4. Prevents infinite sync loops
 */
export function useAdvancedUrlSync() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    
    // Atom states
    const [filters, setFilters] = useAtom(filtersAtom);
    const [sort, setSort] = useAtom(sortAtom);
    const [timeCapsuleMode, setTimeCapsuleMode] = useAtom(timeCapsuleModeAtom);
    const [, setUrlParams] = useAtom(urlParamsAtom);
    const [shouldSyncToUrl, setShouldSyncToUrl] = useAtom(shouldSyncToUrlAtom);
    
    // Track initialization to avoid sync loops
    const isInitialized = useRef(false);
    const lastUrlParams = useRef<string>('');

    // Parse URL parameters to state objects
    const parseUrlToState = () => {
        const urlFilters: FilterState = {};
        const urlSort: SortState = { ...DEFAULT_SORT };
        let urlTimeCapsule = false;

        // Parse filters from URL
        for (const [key, value] of searchParams.entries()) {
            if (key === 'sort') {
                const [sortKey, direction] = value.split(':');
                if (sortKey && (direction === 'asc' || direction === 'desc')) {
                    urlSort.key = sortKey;
                    urlSort.direction = direction;
                }
            } else if (key === 'timeCapsule') {
                urlTimeCapsule = value === 'true';
            } else if (value) {
                // All other params are filters
                urlFilters[key] = value.split(',').filter(Boolean);
            }
        }

        return { urlFilters, urlSort, urlTimeCapsule };
    };

    // Convert state objects to URL search params
    const stateToUrlParams = (
        stateFilters: FilterState,
        stateSort: SortState,
        stateTimeCapsule: boolean
    ) => {
        const params = new URLSearchParams();

        // Add filters to URL
        Object.entries(stateFilters).forEach(([key, values]) => {
            if (values.length > 0) {
                params.set(key, values.join(','));
            }
        });

        // Add sort to URL (only if different from default)
        if (stateSort.key !== DEFAULT_SORT.key || stateSort.direction !== DEFAULT_SORT.direction) {
            params.set('sort', `${stateSort.key}:${stateSort.direction}`);
        }

        // Add time capsule mode (only if true)
        if (stateTimeCapsule) {
            params.set('timeCapsule', 'true');
        }

        return params;
    };

    // Initialize from URL on mount
    useEffect(() => {
        if (isInitialized.current) return;

        const currentUrlParams = searchParams.toString();
        lastUrlParams.current = currentUrlParams;

        // Parse URL parameters
        const { urlFilters, urlSort, urlTimeCapsule } = parseUrlToState();

        // Update URL params atom for other components to read
        setUrlParams({
            filters: urlFilters,
            sort: urlSort,
            timeCapsule: urlTimeCapsule
        });

        // If URL has parameters, restore them to atoms (URL takes priority)
        if (currentUrlParams) {
            setShouldSyncToUrl(false); // Prevent sync loop during restoration
            
            setFilters(urlFilters);
            setSort(urlSort);
            setTimeCapsuleMode(urlTimeCapsule);
            
            // Re-enable URL sync after a short delay
            setTimeout(() => setShouldSyncToUrl(true), 100);
        }

        isInitialized.current = true;
    }, [searchParams, setFilters, setSort, setTimeCapsuleMode, setUrlParams, setShouldSyncToUrl]);

    // Sync atoms to URL when atoms change
    useEffect(() => {
        if (!isInitialized.current || !shouldSyncToUrl) return;

        const newParams = stateToUrlParams(filters, sort, timeCapsuleMode);
        const newUrlParams = newParams.toString();

        // Only update URL if parameters actually changed
        if (newUrlParams !== lastUrlParams.current) {
            lastUrlParams.current = newUrlParams;
            
            // Use replaceState to avoid adding to browser history
            const newUrl = `${location.pathname}${newUrlParams ? `?${newUrlParams}` : ''}`;
            window.history.replaceState(null, '', newUrl);
            
            // Update the Remix search params (for SSR compatibility)
            setSearchParams(newParams, { replace: true });
        }
    }, [filters, sort, timeCapsuleMode, shouldSyncToUrl, location.pathname, setSearchParams]);

    // Return current state and helper functions
    return {
        // Current state
        filters,
        sort,
        timeCapsuleMode,
        
        // State setters
        setFilters,
        setSort,
        setTimeCapsuleMode,
        
        // Helper functions
        clearAllFilters: () => setFilters(DEFAULT_FILTERS),
        resetSort: () => setSort(DEFAULT_SORT),
        resetAll: () => {
            setFilters(DEFAULT_FILTERS);
            setSort(DEFAULT_SORT);
            setTimeCapsuleMode(false);
        },
        
        // URL state info
        hasUrlParams: searchParams.toString().length > 0,
        isInitialized: isInitialized.current
    };
}
