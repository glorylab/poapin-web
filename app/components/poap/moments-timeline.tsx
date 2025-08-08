import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spinner, Button } from "@heroui/react";
import type { POAP } from "~/types/poap";
import { POAP_SIZE, TimelinePoapImage } from "./lazy-poap-image";
import {
  type Moment,
  type MomentsApiResponse,
  LOAD_MORE_THRESHOLD,
} from "./moments-timeline-types";
import {
  formatDate,
  determineGroupingStrategy,
  getQuarterString,
  getMonthString,
  getDateString
} from "./moments-timeline-utils";
import { MomentsGrid } from "./moments-grid";
import { PoapGroupModal } from "./poap-group-modal";


interface MomentsTimelineProps {
  address: string;
  poaps: POAP[];
  // Persistent cache from parent
  momentsCache: import('~/hooks/use-persistent-poap-state').MomentsCache;
  updateMomentsCache: (update: Partial<import('~/hooks/use-persistent-poap-state').MomentsCache>) => void;
  appendMoments: (newMoments: Moment[]) => void;
  // Persistent modal state from parent
  modalState: import('~/hooks/use-persistent-poap-state').ModalState;
  openModal: (poapGroup: any[]) => void;
  closeModal: () => void;
}

// LOAD_MORE_THRESHOLD is imported from moments-timeline-types

export function MomentsTimeline({ address, poaps, momentsCache, updateMomentsCache, appendMoments, modalState, openModal, closeModal }: MomentsTimelineProps) {
  // Use persistent cache instead of internal state
  const { moments, loading, error, hasMore, page } = momentsCache;
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Use persistent modal state from parent
  const { isOpen: isModalOpen, selectedPoapGroup } = modalState;
  
  // Handle POAP group click
  const handlePoapGroupClick = (poapGroup: typeof allTimelineItems[0][]) => {
    openModal(poapGroup);
  };
  
  const handleModalClose = () => {
    closeModal();
  };
  const [containerWidth, setContainerWidth] = useState(() => {
    // Better initial value based on window width if available
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth - 64, 1200); // Max 1200px, minus padding
    }
    return 800; // SSR fallback
  });
  
  // Track moments content width for each POAP item
  const [momentsWidths, setMomentsWidths] = useState<Map<string, number>>(new Map());
  
  // Handle moments layout calculation for each POAP item
  const handleMomentsLayoutCalculated = (poapId: string, momentsWidth: number) => {
    setMomentsWidths(prev => {
      const prevWidth = prev.get(poapId);
      // Only update when width meaningfully changed to avoid infinite update loops
      if (prevWidth !== undefined && Math.abs(prevWidth - momentsWidth) < 1) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(poapId, momentsWidth);
      return newMap;
    });
  };
  
  // Calculate optimal width for a specific POAP item
  const calculateItemOptimalWidth = (poapId: string) => {
    const momentsWidth = momentsWidths.get(poapId);
    if (!momentsWidth) {
      // If moments width data is not available, return default value
      return typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 1200) : 1200;
    }
    
    // Check if we're on mobile (screen width < 640px, which is Tailwind's sm breakpoint)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      // Mobile: Only moments width + padding (no POAP section on the side)
      const optimalWidth = momentsWidth + 32; // Add some padding
      const maxAllowedWidth = window.innerWidth - 32; // Leave some margin
      return Math.min(optimalWidth, maxAllowedWidth);
    } else {
      // Desktop: POAP section + moments width + padding
      const poapSectionWidth = 120; // POAP image section width (w-20 = 80px + padding)
      const optimalWidth = poapSectionWidth + momentsWidth + 48; // Add some spacing
      const maxAllowedWidth = window.innerWidth - 64;
      return Math.min(optimalWidth, maxAllowedWidth);
    }
  };
  
  // Listen for window size changes, re-calculate container width
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Use debouncing to avoid frequent re-calculation
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('MomentsTimeline: Window resized, triggering layout recalculation');
        // Force re-calculate all moments' layout
        setMomentsWidths(new Map()); // Clear cache, trigger re-calculation
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMoments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        updateMomentsCache({ loading: true, error: null });
      } else {
        setLoadingMore(true);
      }

      // Get owner address from first POAP to avoid API doing address resolution
      const ownerAddress = poaps[0]?.owner;
      if (!ownerAddress) {
        updateMomentsCache({ error: 'No owner address found in POAP data', loading: false });
        return;
      }

      const apiUrl = `/api/moments/${ownerAddress}?page=${pageNum}&limit=100`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as MomentsApiResponse;
      if (data.error) {
        throw new Error(data.error);
      }

      // Validate response structure
      if (!data.pagination) {
        throw new Error('Invalid API response: missing pagination data');
      }

      if (append) {
        appendMoments(data.moments);
        updateMomentsCache({ 
          hasMore: data.pagination.hasMore, 
          page: pageNum,
          lastFetchTime: Date.now()
        });
      } else {
        updateMomentsCache({ 
          moments: data.moments,
          hasMore: data.pagination.hasMore, 
          page: pageNum,
          loading: false,
          error: null,
          lastFetchTime: Date.now()
        });
      }
    } catch (err) {
      updateMomentsCache({ 
        error: err instanceof Error ? err.message : 'Failed to fetch moments',
        loading: false
      });
      console.error('Error fetching moments:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have cached data or if address changed
    const hasCachedData = moments.length > 0;
    const cacheAge = Date.now() - momentsCache.lastFetchTime;
    const isCacheStale = cacheAge > 5 * 60 * 1000; // 5 minutes
    
    // Don't fetch if we have valid cached data (prevent unnecessary refetch on navigation return)
    if (!hasCachedData || (isCacheStale && !loading)) {
      console.log('MomentsTimeline: Fetching moments', { hasCachedData, isCacheStale, loading });
      fetchMoments();
    } else {
      console.log('MomentsTimeline: Using cached data', { momentsCount: moments.length, cacheAge });
    }
  }, [address, moments.length, momentsCache.lastFetchTime]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMoments(page + 1, true);
    }
  }, [loadingMore, hasMore, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadingRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMore();
        }
      },
      {
        rootMargin: `${LOAD_MORE_THRESHOLD}px`,
      }
    );

    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  // Dynamic container width detection
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = rect.width;
        // Only update if width is valid and different
        if (newWidth > 0 && Math.abs(newWidth - containerWidth) > 1) {
          setContainerWidth(newWidth);
        }
      } else {
        // Fallback to window width minus some padding
        const fallbackWidth = window.innerWidth - 64; // 32px padding on each side
        if (Math.abs(fallbackWidth - containerWidth) > 1) {
          setContainerWidth(fallbackWidth);
        }
      }
    };

    // Use multiple strategies to ensure accurate measurement
    const measureWithRetry = () => {
      // Immediate measurement
      updateContainerWidth();
      
      // Retry after next frame
      requestAnimationFrame(() => {
        updateContainerWidth();
      });
      
      // Final retry after a short delay to handle any layout shifts
      setTimeout(() => {
        updateContainerWidth();
      }, 100);
    };

    // Initial measurement with retry strategy
    measureWithRetry();

    // Add resize listener
    window.addEventListener('resize', updateContainerWidth);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [containerWidth]);

  // Scroll animation effect for timeline sections
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, [moments.length]); // Re-run when moments are loaded

  // Group moments by drop_id for easier lookup
  const momentsByDrop: Record<number, Moment[]> = {};
  moments.forEach(moment => {
    // Each moment can have multiple drops, but typically has one
    if (moment.drops && Array.isArray(moment.drops)) {
      moment.drops.forEach(dropWrapper => {
        if (dropWrapper?.drop?.id) {
          const dropId = dropWrapper.drop.id;
          if (!momentsByDrop[dropId]) {
            momentsByDrop[dropId] = [];
          }
          momentsByDrop[dropId].push(moment);
        }
      });
    }
  });

  // Create all timeline items with chronological sorting
  const allTimelineItems = poaps.map(poap => {
    // Try both poap.event.id and poap.tokenId for matching
    const poapMoments = momentsByDrop[poap.event.id] || momentsByDrop[Number(poap.tokenId)] || [];
    return {
      poap,
      moments: poapMoments,
      hasMoments: poapMoments.length > 0,
      date: new Date(poap.event.start_date)
    };
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // Create interleaved timeline structure with date-based grouping
  const timelineStructure: (typeof allTimelineItems[0] | typeof allTimelineItems[0][][])[] = [];
  let currentBatch: typeof allTimelineItems[0][] = [];

  allTimelineItems.forEach((item, index) => {
    if (item.hasMoments) {
      // If we have accumulated POAPs without moments, add them as a batch first
      if (currentBatch.length > 0) {
        // Determine the best grouping strategy
        const groupingStrategy = determineGroupingStrategy(currentBatch);

        if (groupingStrategy === 'quarter') {
          // Group POAPs without moments by quarter
          const groupedByQuarter = currentBatch.reduce((groups, poap) => {
            const quarterKey = getQuarterString(poap.date);
            if (!groups[quarterKey]) {
              groups[quarterKey] = [];
            }
            groups[quarterKey].push(poap);
            return groups;
          }, {} as Record<string, typeof allTimelineItems[0][]>);

          // Convert to array of quarter groups, sorted by quarter (newest first)
          const quarterGroups = Object.entries(groupedByQuarter)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, poaps]) => poaps);

          timelineStructure.push(quarterGroups);
        } else if (groupingStrategy === 'month') {
          // Group POAPs without moments by month
          const groupedByMonth = currentBatch.reduce((groups, poap) => {
            const monthKey = getMonthString(poap.date);
            if (!groups[monthKey]) {
              groups[monthKey] = [];
            }
            groups[monthKey].push(poap);
            return groups;
          }, {} as Record<string, typeof allTimelineItems[0][]>);

          // Convert to array of month groups, sorted by month (newest first)
          const monthGroups = Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, poaps]) => poaps);

          timelineStructure.push(monthGroups);
        } else {
          // Group POAPs without moments by date
          const groupedByDate = currentBatch.reduce((groups, poap) => {
            const dateKey = getDateString(poap.date);
            if (!groups[dateKey]) {
              groups[dateKey] = [];
            }
            groups[dateKey].push(poap);
            return groups;
          }, {} as Record<string, typeof allTimelineItems[0][]>);

          // Convert to array of date groups, sorted by date (newest first)
          const dateGroups = Object.entries(groupedByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, poaps]) => poaps);

          timelineStructure.push(dateGroups);
        }
        currentBatch = [];
      }
      // Add the POAP with moments as a single item
      timelineStructure.push(item);
    } else {
      // Accumulate POAPs without moments (no batch size limit)
      currentBatch.push(item);
    }
  });

  // Add any remaining POAPs without moments
  if (currentBatch.length > 0) {
    // Determine the best grouping strategy
    const groupingStrategy = determineGroupingStrategy(currentBatch);

    if (groupingStrategy === 'quarter') {
      // Group POAPs without moments by quarter
      const groupedByQuarter = currentBatch.reduce((groups, poap) => {
        const quarterKey = getQuarterString(poap.date);
        if (!groups[quarterKey]) {
          groups[quarterKey] = [];
        }
        groups[quarterKey].push(poap);
        return groups;
      }, {} as Record<string, typeof allTimelineItems[0][]>);

      // Convert to array of quarter groups, sorted by quarter (newest first)
      const quarterGroups = Object.entries(groupedByQuarter)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, poaps]) => poaps);

      timelineStructure.push(quarterGroups);
    } else if (groupingStrategy === 'month') {
      // Group POAPs without moments by month
      const groupedByMonth = currentBatch.reduce((groups, poap) => {
        const monthKey = getMonthString(poap.date);
        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }
        groups[monthKey].push(poap);
        return groups;
      }, {} as Record<string, typeof allTimelineItems[0][]>);

      // Convert to array of month groups, sorted by month (newest first)
      const monthGroups = Object.entries(groupedByMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, poaps]) => poaps);

      timelineStructure.push(monthGroups);
    } else {
      // Group POAPs without moments by date
      const groupedByDate = currentBatch.reduce((groups, poap) => {
        const dateKey = getDateString(poap.date);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(poap);
        return groups;
      }, {} as Record<string, typeof allTimelineItems[0][]>);

      // Convert to array of date groups, sorted by date (newest first)
      const dateGroups = Object.entries(groupedByDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, poaps]) => poaps);

      timelineStructure.push(dateGroups);
    }
  }

  const withMomentsCount = allTimelineItems.filter(item => item.hasMoments).length;
  const withoutMomentsCount = allTimelineItems.filter(item => !item.hasMoments).length;

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM format
  };

  const formatQuarter = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year} Q${quarter}`; // YYYY Q1 format
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0" />

        {/* Main loading content */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          {/* Enhanced spinner with glow effect */}
          <div className="relative">
            <Spinner
              size="lg"
              className="w-12 h-12"
              classNames={{
                circle1: "border-b-purple-500",
                circle2: "border-b-pink-500"
              }}
            />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-background-500/20 blur-xl animate-pulse" />
          </div>

          {/* Loading text with animation */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-primary/80">
              Entering Time Capsule
            </h3>
            <p className="text-primary/60 animate-pulse">
              Loading your moments timeline...
            </p>
          </div>

          {/* Floating particles animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-purple-400/30 rounded-full animate-bounce`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${2 + i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center relative">
        {/* Error background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-gray-900/5 to-red-900/10" />

        {/* Error content */}
        <div className="relative z-10 flex flex-col items-center space-y-6 max-w-md mx-auto text-center">
          {/* Error icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error message */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Unable to Load Timeline
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>

          {/* Retry button */}
          <button
            onClick={() => fetchMoments()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="space-y-6"
    >
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading moments...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Interleaved Timeline */}
          <div className="space-y-6">
            {timelineStructure.map((segment, segmentIndex) => {
              // Animation class for slide-up effect
              const animationClass = "transform transition-all duration-700 ease-out opacity-0 translate-y-8 animate-on-scroll";
              if (Array.isArray(segment)) {
                // This is a batch of date-grouped POAPs without moments
                // segment is now an array of arrays, where each inner array contains POAPs from the same date
                const dateGroups = segment as typeof allTimelineItems[0][][];
                const cardWidth = 128; // 32 * 4 = 128px (w-32)
                const cardGap = 16; // gap between date groups when flat
                const verticalOffset = 16; // vertical offset for stacking within same date
                const maxVerticalHeight = cardWidth; // Maximum height: 2 POAPs
                // Use parent container's full width instead of measured containerWidth
                const parentContainer = containerRef.current;
                const actualAvailableWidth = parentContainer ? parentContainer.clientWidth : containerWidth;
                const availableWidth = actualAvailableWidth;

                // Calculate dynamic spacing for unified layout
                const totalDateGroups = dateGroups.length;
                const idealTotalWidth = totalDateGroups * cardWidth + (totalDateGroups - 1) * cardGap;
                
                // Layout calculation for centering
                
                // Calculate actual spacing between groups
                let actualGap;
                let containerStartX;
                
                if (idealTotalWidth <= availableWidth) {
                  // Enough space: use ideal gap and center the layout
                  actualGap = cardGap;
                  containerStartX = (availableWidth - idealTotalWidth) / 2;

                } else {
                  // Not enough space: distribute evenly with first and last at edges
                  if (totalDateGroups === 1) {
                    actualGap = 0;
                    containerStartX = (availableWidth - cardWidth) / 2;
                  } else {
                    actualGap = (availableWidth - totalDateGroups * cardWidth) / (totalDateGroups - 1);
                    containerStartX = 0;
                  }

                }

                return (
                  <div key={`date-groups-unified-${segmentIndex}`} className={`my-8 ${animationClass}`} style={{ animationDelay: `${segmentIndex * 100}ms` }}>
                    <div 
                      className="relative group/row w-full flex justify-center"
                      style={{ 
                        height: `${maxVerticalHeight + 48}px` // Extra height for date labels
                      }}
                    >
                      <div 
                        className="relative"
                        style={{
                          width: `${idealTotalWidth}px`,
                          height: `${maxVerticalHeight + 48}px`
                        }}
                      >
                        {dateGroups.map((dateGroup, dateIndex) => {
                          const itemsInGroup = dateGroup.length;
                          const visibleItems = Math.min(itemsInGroup, 10);
                          const offsetX = dateIndex * (cardWidth + actualGap);

                        // Determine if this is a month group or date group
                        const firstItem = dateGroup[0];
                        const groupKey = getDateString(firstItem.date);

                        return (
                          <div
                            key={`date-group-unified-${dateIndex}`}
                            className="absolute top-0 group cursor-pointer transition-all duration-500 ease-out rounded-lg hover:bg-white/30 p-2 -m-2 hover:scale-105 group-hover/row:blur-sm hover:!blur-none hover:!scale-110"
                            style={{
                              left: `${offsetX}px`,
                              zIndex: totalDateGroups - dateIndex
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.zIndex = '9999';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.zIndex = String(totalDateGroups - dateIndex);
                            }}
                            onClick={() => handlePoapGroupClick(dateGroup)}
                          >
                            {/* Vertical stacking container */}
                            <div
                              className="relative"
                              style={{
                                width: `${cardWidth}px`,
                                height: `${maxVerticalHeight}px`
                              }}
                            >
                              {dateGroup.slice(0, Math.min(visibleItems, 3)).map((item, itemIndex) => {
                                const itemZIndex = Math.min(visibleItems, 3) - itemIndex;
                                const baseOffsetY = itemIndex * verticalOffset;

                                return (
                                  <div
                                    key={`poap-unified-${item.poap.event.id}-${itemIndex}`}
                                    className={`absolute w-32 h-32 transition-all duration-300 ease-out ${
                                      itemIndex === 0 ? 'group-hover:scale-[1.02] group-hover:-translate-y-0.5' :
                                      itemIndex === 1 ? 'group-hover:scale-[0.97] group-hover:translate-y-0.5' :
                                      itemIndex === 2 ? 'group-hover:scale-[0.90] group-hover:translate-y-1' :
                                      ''
                                    }`}
                                    style={{
                                      top: `${baseOffsetY}px`,
                                      left: '0px',
                                      zIndex: itemZIndex
                                    }}
                                    title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                                  >
                                    <Card className="w-full h-full p-0 overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-full border-2 border-white">
                                      <TimelinePoapImage
                                        src={item.poap.event.image_url}
                                        alt={item.poap.event.name}
                                        width={128}
                                        height={128}
                                        poapSize={POAP_SIZE.SMALL}
                                        title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                                      />
                                    </Card>
                                  </div>
                                );
                              })}

                              {/* Show +N indicator if more than 3 items */}
                              {itemsInGroup > 3 && (
                                <div
                                  className="absolute w-8 h-8 bg-gray/40 backdrop-blur-sm border border-white/20 text-white/70 text-xs rounded-full flex items-center justify-center font-bold group-hover:bg-gray/50 group-hover:border-white/30 group-hover:text-white"
                                  style={{
                                    top: `${cardWidth}px`,
                                    right: '-8px',
                                    zIndex: 100
                                  }}
                                >
                                  +{itemsInGroup - 3}
                                </div>
                              )}
                            </div>

                            {/* Date/Month/Quarter label below */}
                            <div
                              className="transition-all text-xs text-white/80 mt-10 font-medium text-center group-hover:text-white group-hover:translate-y-1"
                              style={{ width: `${cardWidth}px` }}
                            >
                              {(() => {
                                // Use the same grouping strategy for all columns in this row
                                // by determining strategy based on all items in all dateGroups
                                const allItemsInRow = dateGroups.flat();
                                const rowGroupingStrategy = determineGroupingStrategy(allItemsInRow);

                                return rowGroupingStrategy === 'quarter'
                                  ? formatQuarter(dateGroup[0].poap.event.start_date)
                                  : rowGroupingStrategy === 'month'
                                    ? formatMonth(dateGroup[0].poap.event.start_date)
                                    : formatDate(dateGroup[0].poap.event.start_date);
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // This is a single POAP with moments
                const item = segment;
                return (
                  <Card 
                    key={`poap-with-moments-${item.poap.event.id}`} 
                    className={`overflow-hidden ${animationClass} mx-auto`} 
                    style={{ 
                      animationDelay: `${segmentIndex * 100}ms`,
                      maxWidth: `${calculateItemOptimalWidth(item.poap.tokenId)}px`,
                      width: 'fit-content'
                    }}
                  >
                    {/* Mobile Layout: Stack vertically */}
                    <div className="block sm:hidden">
                      {/* POAP Info */}
                      <div className="p-4 border-b">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.poap.event.image_url}
                            alt={item.poap.event.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                              {item.poap.event.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(item.poap.event.start_date)} • {item.moments.length} moment{item.moments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Moments - Dynamic grid on mobile */}
                      <MomentsGrid 
                        moments={item.moments} 
                        onLayoutCalculated={(width) => handleMomentsLayoutCalculated(item.poap.tokenId, width)}
                      />
                    </div>

                    {/* Desktop Layout: Side by side */}
                    <div className="hidden sm:flex">
                      {/* POAP Image and Date Info */}
                      <div className="flex-shrink-0 p-2">
                        <img
                          src={item.poap.event.image_url}
                          alt={item.poap.event.name}
                          className="w-20 h-20 rounded-lg object-cover mb-3"
                        />
                        <div className="w-20">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <p className="font-bold text-lg font-mono text-background mb-1">
                              {formatDate(item.poap.event.start_date)}
                            </p>
                            <p>
                              {item.moments.length} moment{item.moments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Moments - Responsive grid with overlay title */}
                      <div className="flex-1 relative">
                        {/* Overlay POAP Title */}
                        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 pb-8">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {item.poap.event.name}
                          </h3>
                        </div>

                        <MomentsGrid 
                          moments={item.moments} 
                          onLayoutCalculated={(width) => handleMomentsLayoutCalculated(item.poap.tokenId, width)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              }
            })}
          </div>

          {/* Loading indicator and auto load trigger */}
          {hasMore && (
            <div className="flex flex-col items-center gap-4 p-4" ref={loadingRef}>
              {loadingMore ? (
                <div className="flex items-center gap-2 text-default-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading more moments...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    onPress={loadMore}
                    className="text-default-600 hover:text-primary"
                  >
                    Load More Moments
                  </Button>
                  <p className="text-xs text-default-400">
                    Showing {moments.length} moments
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show completion message when all loaded */}
          {!hasMore && moments.length > 0 && (
            <div className="p-4 text-center text-default-500">
              <p>All moments loaded! 🎉</p>
            </div>
          )}
        </>
      )}
      
      {/* POAP Group Modal */}
      {selectedPoapGroup && (
        <PoapGroupModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          poaps={selectedPoapGroup.map(item => item.poap)}
          dropsWithMoments={[]}
        />
      )}
    </div>
  );
}
