import { useAtom } from 'jotai';
import { useAdvancedUrlSync } from './use-advanced-url-sync';
import {
    isTransitioningAtom,
    showClassicAtom,
    showTimelineAtom,
    FilterState,
    SortState
} from '~/atoms/poap-state';

/**
 * Unified POAP State Management Hook
 * 
 * This hook provides a single interface for all POAP-related state management:
 * - Filters (with URL sync and cross-tab persistence)
 * - Sorting (with URL sync and cross-tab persistence) 
 * - Time Capsule mode (with URL sync and cross-tab persistence)
 * - View transitions (ephemeral state)
 * 
 * Benefits:
 * - State persists across tab switches
 * - URL parameters are respected and synced
 * - Single source of truth for all UI state
 * - Easy to use in any component
 */
export function usePoapState() {
    // URL-synced persistent state
    const {
        filters,
        sort,
        timeCapsuleMode,
        setFilters,
        setSort,
        setTimeCapsuleMode,
        clearAllFilters,
        resetSort,
        resetAll,
        hasUrlParams,
        isInitialized
    } = useAdvancedUrlSync();

    // Ephemeral transition state (doesn't persist)
    const [isTransitioning, setIsTransitioning] = useAtom(isTransitioningAtom);
    const [showClassic, setShowClassic] = useAtom(showClassicAtom);
    const [showTimeline, setShowTimeline] = useAtom(showTimelineAtom);

    // Filter management functions
    const handleFilterChange = (filterTitle: string, values: string[]) => {
        setFilters(prev => ({
            ...prev,
            [filterTitle]: values
        }));
    };

    const handleBatchFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const handleFilterRemove = (filterTitle: string, valueToRemove: string) => {
        setFilters(prev => ({
            ...prev,
            [filterTitle]: prev[filterTitle]?.filter(v => v !== valueToRemove) || []
        }));
    };

    // Sort management functions
    const handleSortChange = (newSort: SortState) => {
        setSort(newSort);
    };

    // Time Capsule management functions
    const handleViewTransition = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        
        if (!timeCapsuleMode) {
            // Entering Time Capsule mode
            setTimeCapsuleMode(true);
            setShowClassic(false);
            
            setTimeout(() => {
                setShowTimeline(true);
                setIsTransitioning(false);
            }, 300);
        } else {
            // Exiting Time Capsule mode
            setTimeCapsuleMode(false);
            setShowTimeline(false);
            
            setTimeout(() => {
                setShowClassic(true);
                setIsTransitioning(false);
            }, 300);
        }
    };

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(values => values.length > 0);

    // Get active filter count
    const activeFilterCount = Object.values(filters).reduce(
        (count, values) => count + values.length, 
        0
    );

    return {
        // Current state
        filters,
        sort,
        timeCapsuleMode,
        isTransitioning,
        showClassic,
        showTimeline,
        
        // Computed state
        hasActiveFilters,
        activeFilterCount,
        hasUrlParams,
        isInitialized,
        
        // Filter actions
        handleFilterChange,
        handleBatchFilterChange,
        handleFilterRemove,
        clearAllFilters,
        
        // Sort actions
        handleSortChange,
        resetSort,
        
        // Time Capsule actions
        handleViewTransition,
        setTimeCapsuleMode,
        
        // Transition state actions
        setIsTransitioning,
        setShowClassic,
        setShowTimeline,
        
        // Reset actions
        resetAll
    };
}
