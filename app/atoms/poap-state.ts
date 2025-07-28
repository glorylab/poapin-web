import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Filter and Sort Types
export interface FilterState {
    [filterTitle: string]: string[];
}

export interface SortState {
    key: string;
    direction: 'asc' | 'desc';
}

// Default values
export const DEFAULT_SORT: SortState = { key: 'date', direction: 'desc' };
export const DEFAULT_FILTERS: FilterState = {};

/**
 * Core POAP UI State Atoms
 * These atoms persist across tab switches and sync with URL
 */

// Filter state - persists in sessionStorage for tab-level persistence
export const filtersAtom = atomWithStorage<FilterState>('poap-filters', DEFAULT_FILTERS);

// Sort state - persists in sessionStorage
export const sortAtom = atomWithStorage<SortState>('poap-sort', DEFAULT_SORT);

// Time Capsule mode - persists in sessionStorage
export const timeCapsuleModeAtom = atomWithStorage<boolean>('poap-time-capsule', false);

// View transition state - ephemeral (doesn't persist)
export const isTransitioningAtom = atom<boolean>(false);
export const showClassicAtom = atom<boolean>(true);
export const showTimelineAtom = atom<boolean>(false);

/**
 * Derived atoms for computed values
 */

// Combined state for easy access
export const poapUIStateAtom = atom(
    (get) => ({
        filters: get(filtersAtom),
        sort: get(sortAtom),
        timeCapsuleMode: get(timeCapsuleModeAtom),
        isTransitioning: get(isTransitioningAtom),
        showClassic: get(showClassicAtom),
        showTimeline: get(showTimelineAtom)
    }),
    (get, set, update: Partial<{
        filters: FilterState;
        sort: SortState;
        timeCapsuleMode: boolean;
        isTransitioning: boolean;
        showClassic: boolean;
        showTimeline: boolean;
    }>) => {
        if (update.filters !== undefined) set(filtersAtom, update.filters);
        if (update.sort !== undefined) set(sortAtom, update.sort);
        if (update.timeCapsuleMode !== undefined) set(timeCapsuleModeAtom, update.timeCapsuleMode);
        if (update.isTransitioning !== undefined) set(isTransitioningAtom, update.isTransitioning);
        if (update.showClassic !== undefined) set(showClassicAtom, update.showClassic);
        if (update.showTimeline !== undefined) set(showTimelineAtom, update.showTimeline);
    }
);

/**
 * URL Sync atoms - these handle URL parameter synchronization
 */

// URL parameters atom (read-only, updated by URL sync hook)
export const urlParamsAtom = atom<{
    filters: FilterState;
    sort: SortState;
    timeCapsule: boolean;
}>({
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    timeCapsule: false
});

// Atom to track if we should sync to URL (prevents infinite loops)
export const shouldSyncToUrlAtom = atom<boolean>(true);
