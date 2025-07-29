import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from '@remix-run/react';
import type { POAP } from '~/types/poap';
import { filterPoaps, sortPoaps } from '~/utils/poap-filter-sort';
import { PlausibleEvents } from '~/utils/usePlausible';
import type { Moment, MomentsApiResponse } from '~/components/poap/moments-timeline-types';

// Types
export interface FilterState {
    [filterTitle: string]: string[];
}

export interface SortState {
    key: string;
    direction: 'asc' | 'desc';
}

export interface MomentsCache {
    moments: Moment[];
    hasMore: boolean;
    page: number;
    loading: boolean;
    error: string | null;
    lastFetchTime: number;
}

// Default values
export const DEFAULT_SORT: SortState = { key: 'date', direction: 'desc' };
export const DEFAULT_FILTERS: FilterState = {};
export const DEFAULT_MOMENTS_CACHE: MomentsCache = {
    moments: [],
    hasMore: false,
    page: 1,
    loading: false,
    error: null,
    lastFetchTime: 0
};

/**
 * Persistent POAP State Hook
 * 
 * This hook provides persistent state management that survives tab switches:
 * - State is stored in sessionStorage for tab-level persistence
 * - URL parameters take priority over stored state
 * - No unnecessary re-initialization on component remount
 * - Prevents state reset during tab switching
 * - Clears state when address changes or when accessing without parameters
 */
export function usePersistentPoapState(address?: string) {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    
    // Generate storage keys based on address
    const getStorageKey = (key: string) => address ? `poap-${key}-${address}` : `poap-${key}`;
    
    // Persistent state using sessionStorage with address-specific keys
    const [filters, setFilters] = useState<FilterState>(() => {
        if (typeof window === 'undefined') return DEFAULT_FILTERS;
        try {
            const stored = sessionStorage.getItem(getStorageKey('filters'));
            return stored ? JSON.parse(stored) : DEFAULT_FILTERS;
        } catch {
            return DEFAULT_FILTERS;
        }
    });
    
    const [sort, setSort] = useState<SortState>(() => {
        if (typeof window === 'undefined') return DEFAULT_SORT;
        try {
            const stored = sessionStorage.getItem(getStorageKey('sort'));
            return stored ? JSON.parse(stored) : DEFAULT_SORT;
        } catch {
            return DEFAULT_SORT;
        }
    });
    
    const [timeCapsuleMode, setTimeCapsuleMode] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            const stored = sessionStorage.getItem(getStorageKey('time-capsule'));
            return stored ? JSON.parse(stored) : false;
        } catch {
            return false;
        }
    });
    
    const [momentsCache, setMomentsCache] = useState<MomentsCache>(() => {
        if (typeof window === 'undefined') return DEFAULT_MOMENTS_CACHE;
        try {
            const stored = sessionStorage.getItem(getStorageKey('moments'));
            return stored ? JSON.parse(stored) : DEFAULT_MOMENTS_CACHE;
        } catch {
            return DEFAULT_MOMENTS_CACHE;
        }
    });
    
    // Track current address to detect changes
    const [currentAddress, setCurrentAddress] = useState<string | undefined>(address);
    
    // Ephemeral transition state (doesn't persist)
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showClassic, setShowClassic] = useState(true);
    const [showTimeline, setShowTimeline] = useState(false);
    
    // Track initialization to avoid loops
    const isInitialized = useRef(false);
    const lastUrlParams = useRef<string>('');
    const lastPathname = useRef<string>('');
    const isTabSwitch = useRef(false);
    
    // Parse URL parameters (custom implementation to avoid dependency on Remix searchParams)
    const parseUrlToState = () => {
        const urlFilters: FilterState = {};
        const urlSort: SortState = { ...DEFAULT_SORT };
        let urlTimeCapsule = false;

        // Parse current URL search params directly
        const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
        const urlSearchParams = new URLSearchParams(currentUrl);

        for (const [key, value] of urlSearchParams.entries()) {
            if (key === 'sort') {
                const [sortKey, direction] = value.split(':');
                if (sortKey && (direction === 'asc' || direction === 'desc')) {
                    urlSort.key = sortKey;
                    urlSort.direction = direction;
                }
            } else if (key === 'timeCapsule') {
                urlTimeCapsule = value === 'true';
            } else if (key === 'auto_time_capsule') {
                // Handle auto_time_capsule parameter - it's not a filter, just a flag
                urlTimeCapsule = value === 'true';
            } else if (value) {
                urlFilters[key] = value.split(',').filter(Boolean);
            }
        }

        return { urlFilters, urlSort, urlTimeCapsule };
    };
    
    // Handle address changes and parameter-less access
    useEffect(() => {
        const currentPathname = location.pathname;
        const currentUrlParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        
        // Detect if this is a tab switch (same address, different path)
        const isCurrentlyTabSwitch = Boolean(lastPathname.current && 
                                           lastPathname.current !== currentPathname &&
                                           currentAddress === address);
        
        isTabSwitch.current = isCurrentlyTabSwitch;
        
        // If address changed, clear all state
        if (currentAddress !== address) {
            console.log('Address changed from', currentAddress, 'to', address, '- clearing state');
            setFilters(DEFAULT_FILTERS);
            setSort(DEFAULT_SORT);
            setTimeCapsuleMode(false);
            setCurrentAddress(address);
            
            // Clear old storage entries for previous address
            if (typeof window !== 'undefined' && currentAddress) {
                const oldGetStorageKey = (key: string) => `poap-${key}-${currentAddress}`;
                sessionStorage.removeItem(oldGetStorageKey('filters'));
                sessionStorage.removeItem(oldGetStorageKey('sort'));
                sessionStorage.removeItem(oldGetStorageKey('time-capsule'));
            }
            
            // Reset initialization flag to allow new initialization
            isInitialized.current = false;
            lastPathname.current = currentPathname;
            return;
        }
        
        // Only clear state if:
        // 1. No URL parameters AND
        // 2. We have stored state AND 
        // 3. This is NOT a tab switch (user directly accessed without params)
        if (!currentUrlParams && isInitialized.current && !isTabSwitch.current && address) {
            // Check stored state directly from sessionStorage to avoid closure issues
            const storedFilters = sessionStorage.getItem(getStorageKey('filters'));
            const storedSort = sessionStorage.getItem(getStorageKey('sort'));
            const storedTimeCapsule = sessionStorage.getItem(getStorageKey('time-capsule'));
            const storedMoments = sessionStorage.getItem(getStorageKey('moments'));
            
            const hasStoredState = storedFilters || storedSort || storedTimeCapsule || storedMoments;
            
            if (hasStoredState) {
                console.log('Direct access without URL params but has stored state - clearing state');
                setFilters(DEFAULT_FILTERS);
                setSort(DEFAULT_SORT);
                setTimeCapsuleMode(false);
                setMomentsCache(DEFAULT_MOMENTS_CACHE);
                
                // Clear storage as well
                sessionStorage.removeItem(getStorageKey('filters'));
                sessionStorage.removeItem(getStorageKey('sort'));
                sessionStorage.removeItem(getStorageKey('time-capsule'));
                sessionStorage.removeItem(getStorageKey('moments'));
            }
        }
        
        // Update tracking variables
        lastPathname.current = currentPathname;
    }, [address, currentAddress, location.pathname]);
    
    // Initialize from URL on first mount only
    useEffect(() => {
        if (isInitialized.current) return;
        
        const currentUrlParams = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
        lastUrlParams.current = currentUrlParams;
        
        // If URL has parameters, they take priority
        if (currentUrlParams) {
            const { urlFilters, urlSort, urlTimeCapsule } = parseUrlToState();
            setFilters(urlFilters);
            setSort(urlSort);
            setTimeCapsuleMode(urlTimeCapsule);
        }
        
        isInitialized.current = true;
    }, [address]); // Only depend on address, not searchParams
    
    // Persist state to sessionStorage with address-specific keys
    useEffect(() => {
        if (typeof window === 'undefined' || !address) return;
        sessionStorage.setItem(getStorageKey('filters'), JSON.stringify(filters));
    }, [filters, address]);
    
    useEffect(() => {
        if (typeof window === 'undefined' || !address) return;
        sessionStorage.setItem(getStorageKey('sort'), JSON.stringify(sort));
    }, [sort, address]);
    
    useEffect(() => {
        if (typeof window === 'undefined' || !address) return;
        sessionStorage.setItem(getStorageKey('time-capsule'), timeCapsuleMode.toString());
    }, [timeCapsuleMode, address]);
    
    useEffect(() => {
        if (typeof window === 'undefined' || !address) return;
        sessionStorage.setItem(getStorageKey('moments'), JSON.stringify(momentsCache));
    }, [momentsCache, address]);
    
    // Sync to URL (debounced to avoid excessive updates)
    useEffect(() => {
        if (!isInitialized.current) return;
        
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams();
            
            // Add filters
            Object.entries(filters).forEach(([key, values]) => {
                if (values.length > 0) {
                    params.set(key, values.join(','));
                }
            });
            
            // Add sort (only if different from default)
            if (sort.key !== DEFAULT_SORT.key || sort.direction !== DEFAULT_SORT.direction) {
                params.set('sort', `${sort.key}:${sort.direction}`);
            }
            
            // Add time capsule mode (only if true)
            if (timeCapsuleMode) {
                params.set('timeCapsule', 'true');
            }
            
            const newUrlParams = params.toString();
            if (newUrlParams !== lastUrlParams.current) {
                lastUrlParams.current = newUrlParams;
                // Use window.history.replaceState to avoid server requests (pure client-side filtering)
                const newUrl = `${location.pathname}${newUrlParams ? `?${newUrlParams}` : ''}`;
                window.history.replaceState(null, '', newUrl);
            }
        }, 100); // 100ms debounce
        
        return () => clearTimeout(timeoutId);
    }, [filters, sort, timeCapsuleMode, location.pathname]);
    
    // Helper functions
    const handleFilterChange = (filterTitle: string, values: string[]) => {
        setFilters(prev => ({ ...prev, [filterTitle]: values }));
    };
    
    const handleBatchFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        // Track filter application
        if (address) {
            PlausibleEvents.trackFilterApply(newFilters, address);
        }
    };
    
    const handleFilterRemove = (filterTitle: string, valueToRemove: string) => {
        setFilters(prev => ({
            ...prev,
            [filterTitle]: prev[filterTitle]?.filter(v => v !== valueToRemove) || []
        }));
        // Track filter removal
        if (address) {
            PlausibleEvents.trackFilterRemove(filterTitle, valueToRemove, address);
        }
    };
    
    const handleSortChange = (newSort: SortState) => {
        setSort(newSort);
        // Track sort change
        if (address) {
            PlausibleEvents.trackSortChange(newSort, address);
        }
    };
    
    const handleViewTransition = (poapsCount?: number, momentsCount?: number) => {
        if (isTransitioning) return;
        
        setIsTransitioning(true);
        
        if (!timeCapsuleMode) {
            setTimeCapsuleMode(true);
            setShowClassic(false);
            // Track entering Time Capsule mode
            if (address) {
                PlausibleEvents.trackTimeCapsuleEnter(
                    address, 
                    momentsCount || 0, 
                    poapsCount || 0
                );
            }
            setTimeout(() => {
                setShowTimeline(true);
                setIsTransitioning(false);
            }, 300);
        } else {
            setTimeCapsuleMode(false);
            setShowTimeline(false);
            // Track exiting Time Capsule mode
            if (address) {
                PlausibleEvents.trackTimeCapsuleExit(address);
            }
            setTimeout(() => {
                setShowClassic(true);
                setIsTransitioning(false);
            }, 300);
        }
    };
    
    const clearAllFilters = () => {
        setFilters(DEFAULT_FILTERS);
        // Track clearing all filters
        if (address) {
            PlausibleEvents.trackFilterClear(address);
        }
    };
    const resetSort = () => setSort(DEFAULT_SORT);
    const resetAll = () => {
        setFilters(DEFAULT_FILTERS);
        setSort(DEFAULT_SORT);
        setTimeCapsuleMode(false);
        setMomentsCache(DEFAULT_MOMENTS_CACHE);
    };
    
    // Moments cache operations
    const updateMomentsCache = useCallback((update: Partial<MomentsCache>) => {
        setMomentsCache(prev => ({ ...prev, ...update }));
    }, []);
    
    const appendMoments = useCallback((newMoments: Moment[]) => {
        setMomentsCache(prev => ({
            ...prev,
            moments: [...prev.moments, ...newMoments]
        }));
    }, []);
    
    const resetMomentsCache = useCallback(() => {
        setMomentsCache(DEFAULT_MOMENTS_CACHE);
    }, []);
    
    // Computed values
    const hasActiveFilters = Object.values(filters).some(values => values.length > 0);
    const activeFilterCount = Object.values(filters).reduce((count, values) => count + values.length, 0);
    
    return {
        // Current state
        filters,
        sort,
        timeCapsuleMode,
        isTransitioning,
        showClassic,
        showTimeline,
        momentsCache,
        
        // Computed state
        hasActiveFilters,
        activeFilterCount,
        hasUrlParams: searchParams.toString().length > 0,
        isInitialized: isInitialized.current,
        
        // Actions
        handleFilterChange,
        handleBatchFilterChange,
        handleFilterRemove,
        clearAllFilters,
        handleSortChange,
        resetSort,
        handleViewTransition,
        setTimeCapsuleMode,
        setIsTransitioning,
        setShowClassic,
        setShowTimeline,
        resetAll,
        
        // Moments cache operations
        updateMomentsCache,
        appendMoments,
        resetMomentsCache
    };
}
