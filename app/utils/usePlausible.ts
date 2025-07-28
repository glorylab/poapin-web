import { useEffect, useRef } from "react";
import { useLocation } from "@remix-run/react";
import type { FilterState, SortState } from "~/hooks/use-persistent-poap-state";

declare global {
  interface Window {
    plausible?: (event: string, opts?: Record<string, unknown>) => void;
  }
}

export function usePlausiblePageview() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.plausible === "function") {
      window.plausible("pageview", {
        // keep Plausible's default URL format
        u: pathname + search,
      });
    }
  }, [pathname, search]);
}

// Helper function to safely call Plausible
function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.plausible === "function") {
    window.plausible(event, properties);
  }
}

// User behavior tracking functions
export const PlausibleEvents = {
  // Filter tracking
  trackFilterApply: (filters: FilterState, address: string) => {
    const activeFilters = Object.entries(filters)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => ({ filter: key, values: values.join(',') }));
    
    if (activeFilters.length > 0) {
      trackEvent('Filter Applied', {
        address,
        filterCount: activeFilters.length,
        filters: activeFilters.map(f => f.filter).join(','),
        // Include specific filter details
        ...activeFilters.reduce((acc, { filter, values }) => {
          acc[`filter_${filter}`] = values;
          return acc;
        }, {} as Record<string, string>)
      });
    }
  },

  trackFilterRemove: (filterKey: string, filterValue: string, address: string) => {
    trackEvent('Filter Removed', {
      address,
      filterKey,
      filterValue
    });
  },

  trackFilterClear: (address: string) => {
    trackEvent('Filters Cleared', {
      address
    });
  },

  // Sort tracking
  trackSortChange: (sort: SortState, address: string) => {
    trackEvent('Sort Changed', {
      address,
      sortKey: sort.key,
      sortDirection: sort.direction,
      sortOption: `${sort.key}_${sort.direction}`
    });
  },

  // Time Capsule tracking
  trackTimeCapsuleEnter: (address: string, momentsCount: number, poapsCount: number) => {
    trackEvent('Time Capsule Entered', {
      address,
      momentsCount,
      poapsCount,
      hasContent: momentsCount > 0
    });
  },

  trackTimeCapsuleExit: (address: string, timeSpent?: number) => {
    trackEvent('Time Capsule Exited', {
      address,
      ...(timeSpent && { timeSpent })
    });
  },

  // Tab navigation tracking
  trackTabSwitch: (fromTab: string, toTab: string, address: string) => {
    trackEvent('Tab Switched', {
      address,
      fromTab,
      toTab,
      tabSwitch: `${fromTab}_to_${toTab}`
    });
  },

  // POAP interaction tracking
  trackPoapClick: (poapId: string, address: string, context: 'grid' | 'timeline') => {
    trackEvent('POAP Clicked', {
      address,
      poapId,
      context
    });
  },

  // Modal/UI interaction tracking
  trackFilterModalOpen: (address: string) => {
    trackEvent('Filter Modal Opened', {
      address
    });
  },

  trackSortModalOpen: (address: string) => {
    trackEvent('Sort Modal Opened', {
      address
    });
  },

  // Search and discovery tracking
  trackAddressSearch: (searchTerm: string, resultFound: boolean) => {
    trackEvent('Address Searched', {
      searchTerm: searchTerm.toLowerCase(),
      resultFound,
      searchLength: searchTerm.length
    });
  },

  // Performance tracking
  trackPageLoadTime: (address: string, loadTime: number) => {
    trackEvent('Page Load Performance', {
      address,
      loadTime,
      loadTimeCategory: loadTime < 2000 ? 'fast' : loadTime < 5000 ? 'medium' : 'slow'
    });
  }
};

// Hook for tracking Time Capsule session duration
export function useTimeCapsuleTracking(address: string) {
  const startTimeRef = useRef<number | null>(null);

  const startTracking = () => {
    startTimeRef.current = Date.now();
  };

  const endTracking = () => {
    if (startTimeRef.current) {
      const timeSpent = Date.now() - startTimeRef.current;
      PlausibleEvents.trackTimeCapsuleExit(address, timeSpent);
      startTimeRef.current = null;
    }
  };

  return { startTracking, endTracking };
}
