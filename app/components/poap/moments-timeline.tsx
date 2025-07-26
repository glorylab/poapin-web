import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardBody, Image, Chip, Spinner, Button } from "@heroui/react";
import type { POAP } from "~/types/poap";

interface MomentMedia {
  gateways: {
    url: string;
    type: string;
  }[];
  status: string;
}

interface MomentLink {
  url: string;
  title: string;
}

interface MomentUserTag {
  ens: string | null;
  address: string;
}

interface MediaGateway {
  metadata?: {
    size?: number;
    width?: number;
    height?: number;
    gateway_type?: string;
  };
  url: string;
  type: string;
}

interface Media {
  mime_type: string;
  gateways?: MediaGateway[];
}

interface Moment {
  id: string;
  author: string;
  created_on: string;
  description?: string;
  drops: {
    drop: {
      id: number;
      image_url: string;
      name: string;
      description: string;
    };
  }[];
  media?: Media[];
  media_aggregate?: {
    aggregate: {
      count: number;
    };
  };
  user_tags_aggregate?: {
    aggregate: {
      count: number;
    };
  };
  links?: {
    description?: string;
    image_url?: string;
    title: string;
    url: string;
  }[];
}

interface MomentsApiResponse {
  moments: Moment[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}

interface MomentsTimelineProps {
  address: string;
  poaps: POAP[];
}

const LOAD_MORE_THRESHOLD = 200; // Load more when user is 200px from bottom

export function MomentsTimeline({ address, poaps }: MomentsTimelineProps) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800); // Default fallback
  const loadingRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMoments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      // Get owner address from first POAP to avoid API doing address resolution
      const ownerAddress = poaps[0]?.owner;
      if (!ownerAddress) {
        setError('No owner address found in POAP data');
        setLoading(false);
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
        setMoments(prev => [...prev, ...data.moments]);
      } else {
        setMoments(data.moments);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch moments');
      console.error('Error fetching moments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, [address]);

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
        setContainerWidth(rect.width);
      } else {
        // Fallback to window width minus some padding
        setContainerWidth(window.innerWidth - 64); // 32px padding on each side
      }
    };

    // Initial measurement
    updateContainerWidth();

    // Add resize listener
    window.addEventListener('resize', updateContainerWidth);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

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

  // Helper functions for intelligent grouping
  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  const getMonthString = (date: Date) => {
    return date.toISOString().substring(0, 7); // YYYY-MM format
  };
  
  const getQuarterString = (date: Date) => {
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`; // YYYY-Q1 format
  };
  
  const determineGroupingStrategy = (items: typeof allTimelineItems[0][]) => {
    if (items.length === 0) return 'day';
    
    // Get unique dates
    const uniqueDates = [...new Set(items.map(item => getDateString(item.date)))];
    
    // If 10 days or fewer, group by day
    if (uniqueDates.length <= 10) return 'day';
    
    // Check time span
    const dates = items.map(item => item.date).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                      (lastDate.getMonth() - firstDate.getMonth());
    
    // If spans 3 months or less, group by day
    if (monthsDiff <= 3) return 'day';
    
    // Try month grouping first
    const uniqueMonths = [...new Set(items.map(item => getMonthString(item.date)))];
    
    // If 10 months or fewer, group by month
    if (uniqueMonths.length <= 10) return 'month';
    
    // Otherwise, group by quarter
    return 'quarter';
  };
  
  // Legacy function for backward compatibility
  const shouldGroupByMonth = (items: typeof allTimelineItems[0][]) => {
    return determineGroupingStrategy(items) !== 'day';
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
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
    <div ref={containerRef} className="space-y-6">
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
                const verticalOffset = 8; // vertical offset for stacking within same date
                const maxVerticalHeight = cardWidth + verticalOffset; // Maximum height: 2 POAPs
                const availableWidth = containerWidth; // Dynamic container width
                
                // Calculate total width needed for flat layout
                const flatRowWidth = dateGroups.length * cardWidth + (dateGroups.length - 1) * cardGap;
                
                // Decide layout: flat row if fits, otherwise horizontal stacking like original
                const useFlat = flatRowWidth <= availableWidth;
                
                if (useFlat) {
                  // Flat row layout with vertical stacking within each date group
                  return (
                    <div key={`date-groups-flat-${segmentIndex}`} className={`my-8 ${animationClass}`} style={{ animationDelay: `${segmentIndex * 100}ms` }}>
                      <div className="flex gap-4 justify-center">
                        {dateGroups.map((dateGroup, dateIndex) => {
                          const itemsInGroup = dateGroup.length;
                          // Show up to 10 items, then +N for the rest
                          const visibleItems = Math.min(itemsInGroup, 10);
                          const actualHeight = cardWidth + (Math.min(visibleItems, 2) - 1) * verticalOffset;
                          
                          // Determine if this is a month group or date group
                          const firstItem = dateGroup[0];
                          const groupKey = getDateString(firstItem.date);
                          const isMonthGroup = shouldGroupByMonth([firstItem]) && dateGroup.some(item => 
                            getDateString(item.date) !== groupKey
                          );
                          
                          return (
                            <div key={`date-group-flat-${dateIndex}`} className="flex flex-col items-center">
                              {/* Vertical stacking container */}
                              <div 
                                className="relative"
                                style={{ 
                                  width: `${cardWidth}px`, 
                                  height: `${actualHeight}px` 
                                }}
                              >
                                {dateGroup.slice(0, Math.min(visibleItems, 2)).map((item, itemIndex) => {
                                  const zIndex = Math.min(visibleItems, 2) - itemIndex; // First item has highest z-index
                                  const offsetY = itemIndex * verticalOffset; // Vertical stacking
                                  
                                  return (
                                    <div
                                      key={`poap-flat-${item.poap.event.id}-${itemIndex}`}
                                      className="absolute w-32 h-32 transition-all duration-300 hover:scale-95 hover:z-50"
                                      style={{
                                        top: `${offsetY}px`,
                                        left: '0px',
                                        zIndex: zIndex
                                      }}
                                      title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                                    >
                                      <Card className="w-full h-full p-0 overflow-hidden shadow-md hover:shadow-xl transition-shadow rounded-full border-2 border-white">
                                        <img
                                          src={item.poap.event.image_url}
                                          alt={item.poap.event.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </Card>
                                    </div>
                                  );
                                })}
                                
                                {/* Show +N indicator if more than 10 items */}
                                {itemsInGroup > 10 && (
                                  <div 
                                    className="absolute w-8 h-8 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    style={{
                                      top: `${cardWidth - 16}px`,
                                      right: '-8px',
                                      zIndex: 100
                                    }}
                                  >
                                    +{itemsInGroup - 10}
                                  </div>
                                )}
                              </div>
                              
                              {/* Date/Month/Quarter label below */}
                              <div className="text-xs text-gray-500 mt-2 font-medium">
                                {(() => {
                                  const groupingStrategy = determineGroupingStrategy(dateGroup);
                                  const quarterKey = getQuarterString(firstItem.date);
                                  const monthKey = getMonthString(firstItem.date);
                                  
                                  const isQuarterGroup = dateGroup.some(item => getQuarterString(item.date) !== quarterKey) ||
                                                       groupingStrategy === 'quarter';
                                  const isMonthGroupLocal = !isQuarterGroup && (dateGroup.some(item => getMonthString(item.date) !== monthKey) ||
                                                           groupingStrategy === 'month');
                                  
                                  return isQuarterGroup 
                                    ? formatQuarter(dateGroup[0].poap.event.start_date)
                                    : isMonthGroupLocal 
                                      ? formatMonth(dateGroup[0].poap.event.start_date)
                                      : formatDate(dateGroup[0].poap.event.start_date);
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  // Horizontal stacking layout (like original poker-card stacking)
                  const totalDateGroups = dateGroups.length;
                  const maxSpread = 800; // Maximum spread width for stacking
                  const stackWidth = Math.min(maxSpread, availableWidth - cardWidth);
                  const stepSize = totalDateGroups > 1 ? stackWidth / (totalDateGroups - 1) : 0;
                  
                  return (
                    <div key={`date-groups-stack-${segmentIndex}`} className={`my-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${animationClass}`} style={{ animationDelay: `${segmentIndex * 100}ms` }}>
                      <div 
                        className="relative mx-auto" 
                        style={{ width: `${cardWidth + stackWidth}px`, height: `${maxVerticalHeight + 32}px` }} // Extra height for date labels
                      >
                        {dateGroups.map((dateGroup, dateIndex) => {
                          const zIndex = totalDateGroups - dateIndex; // First group has highest z-index
                          const offsetX = dateIndex * stepSize; // Horizontal distribution
                          const itemsInGroup = dateGroup.length;
                          // Show up to 10 items, then +N for the rest
                          const visibleItems = Math.min(itemsInGroup, 10);
                          
                          // Determine if this is a month group or date group
                          const firstItem = dateGroup[0];
                          const groupKey = getDateString(firstItem.date);
                          const isMonthGroup = shouldGroupByMonth([firstItem]) && dateGroup.some(item => 
                            getDateString(item.date) !== groupKey
                          );
                          
                          return (
                            <div
                              key={`date-group-stack-${dateIndex}`}
                              className="absolute top-0"
                              style={{
                                left: `${offsetX}px`,
                                zIndex: zIndex
                              }}
                            >
                              {/* Vertical stacking container */}
                              <div 
                                className="relative"
                                style={{ 
                                  width: `${cardWidth}px`, 
                                  height: `${maxVerticalHeight}px` 
                                }}
                              >
                                {dateGroup.slice(0, Math.min(visibleItems, 2)).map((item, itemIndex) => {
                                  const itemZIndex = Math.min(visibleItems, 2) - itemIndex;
                                  const offsetY = itemIndex * verticalOffset;
                                  
                                  return (
                                    <div
                                      key={`poap-stack-${item.poap.event.id}-${itemIndex}`}
                                      className="absolute w-32 h-32 transition-all duration-300 hover:scale-95 hover:z-50"
                                      style={{
                                        top: `${offsetY}px`,
                                        left: '0px',
                                        zIndex: itemZIndex
                                      }}
                                      title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                                    >
                                      <Card className="w-full h-full p-0 overflow-hidden shadow-md hover:shadow-xl transition-shadow rounded-full border-2 border-white">
                                        <img
                                          src={item.poap.event.image_url}
                                          alt={item.poap.event.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </Card>
                                    </div>
                                  );
                                })}
                                
                                {/* Show +N indicator if more than 10 items */}
                                {itemsInGroup > 10 && (
                                  <div 
                                    className="absolute w-8 h-8 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                    style={{
                                      top: `${cardWidth - 16}px`,
                                      right: '-8px',
                                      zIndex: 100
                                    }}
                                  >
                                    +{itemsInGroup - 10}
                                  </div>
                                )}
                              </div>
                              
                              {/* Date/Month label below */}
                              <div 
                                className="text-xs text-gray-500 mt-2 font-medium text-center"
                                style={{ width: `${cardWidth}px` }}
                              >
                                {(() => {
                                  const groupingStrategy = determineGroupingStrategy(dateGroup);
                                  const quarterKey = getQuarterString(firstItem.date);
                                  const monthKey = getMonthString(firstItem.date);
                                  
                                  const isQuarterGroup = dateGroup.some(item => getQuarterString(item.date) !== quarterKey) ||
                                                       groupingStrategy === 'quarter';
                                  const isMonthGroupLocal = !isQuarterGroup && (dateGroup.some(item => getMonthString(item.date) !== monthKey) ||
                                                           groupingStrategy === 'month');
                                  
                                  return isQuarterGroup 
                                    ? formatQuarter(dateGroup[0].poap.event.start_date)
                                    : isMonthGroupLocal 
                                      ? formatMonth(dateGroup[0].poap.event.start_date)
                                      : formatDate(dateGroup[0].poap.event.start_date);
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              } else {
                // This is a single POAP with moments
                const item = segment;
                return (
                  <Card key={`poap-with-moments-${item.poap.event.id}`} className={`overflow-hidden ${animationClass}`} style={{ animationDelay: `${segmentIndex * 100}ms` }}>
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
                      
                      {/* Moments - Single column on mobile */}
                      <div className="grid grid-cols-1 gap-0">
                        {item.moments.map((moment: Moment) => {
                          const thumbnailMedia = moment.media?.find(m => 
                            m.gateways?.some(g => g.metadata?.gateway_type === 'thumbnail')
                          );
                          const thumbnailGateway = thumbnailMedia?.gateways?.find(g => 
                            g.metadata?.gateway_type === 'thumbnail'
                          ) || thumbnailMedia?.gateways?.[0];
                          
                          const hasMedia = !!thumbnailGateway;
                          const hasDescription = !!moment.description;
                          const hasLinks = moment.links?.length > 0;
                          const linkPreview = hasLinks ? moment.links?.[0] : null;
                          
                          return (
                            <div key={moment.id} className="relative">
                              {hasMedia ? (
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={thumbnailGateway.url}
                                    alt="Moment media"
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Overlay with moment info */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                    {hasDescription && (
                                      <div className="text-white text-sm mb-1">
                                        {moment.description}
                                      </div>
                                    )}
                                    <div className="text-white/80 text-xs">
                                      {formatDate(moment.created_on)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Text/Link only moment */
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 min-h-[120px] flex flex-col justify-between">
                                  <div>
                                    {hasDescription && (
                                      <div className="text-gray-900 dark:text-white text-sm mb-3 leading-relaxed">
                                        {moment.description}
                                      </div>
                                    )}
                                    {linkPreview && (
                                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                        {linkPreview.image_url && (
                                          <img
                                            src={linkPreview.image_url}
                                            alt={linkPreview.title}
                                            className="w-full h-24 object-cover"
                                          />
                                        )}
                                        <div className="p-2">
                                          <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {linkPreview.title}
                                          </div>
                                          {linkPreview.description && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                              {linkPreview.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                                    {formatDate(moment.created_on)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
                        
                        <div className={`grid gap-0 auto-rows-[12rem] ${
                          item.moments.length === 1 ? 'grid-cols-1' :
                          item.moments.length === 2 ? 'grid-cols-2' :
                          'grid-cols-2 lg:grid-cols-4'
                        }`}>
                          {item.moments.map((moment: Moment, idx) => {
                            const thumbnailMedia = moment.media?.find(m => 
                              m.gateways?.some(g => g.metadata?.gateway_type === 'thumbnail')
                            );
                            const thumbnailGateway = thumbnailMedia?.gateways?.find(g => 
                              g.metadata?.gateway_type === 'thumbnail'
                            ) || thumbnailMedia?.gateways?.[0];
                            
                            // Check if this is a video moment
                            const videoMedia = moment.media?.find(m => 
                              m.mime_type?.startsWith('video/')
                            );
                            const isVideoMoment = !!videoMedia && !thumbnailGateway;
                            
                            const hasMedia = !!thumbnailGateway;
                            const hasDescription = !!moment.description;
                            const hasLinks = moment.links?.length > 0;
                            const linkPreview = hasLinks ? moment.links?.[0] : null;
                            const isOddLast = item.moments.length % 2 === 1 && idx === item.moments.length - 1 && item.moments.length > 2;
                            
                            return (
                              <div 
                                key={moment.id} 
                                className={`relative overflow-hidden ${
                                  isOddLast ? 'col-span-2 lg:col-span-1' : ''
                                }`}
                              >
                                {hasMedia ? (
                                  <div className="relative h-full">
                                    <img
                                      src={thumbnailGateway.url}
                                      alt="Moment media"
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Overlay with moment info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                      {hasDescription && (
                                        <div className="text-white text-xs mb-1 line-clamp-2">
                                          {moment.description}
                                        </div>
                                      )}
                                      <div className="text-white/80 text-xs">
                                        {formatDate(moment.created_on)}
                                      </div>
                                    </div>
                                  </div>
                                ) : isVideoMoment ? (
                                  /* Video moment placeholder */
                                  <div className="relative h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {/* Video icon */}
                                    <div className="text-white text-center">
                                      <div className="text-3xl mb-2">🎬</div>
                                      <div className="text-xs font-medium mb-1">Video Moment</div>
                                      <div className="text-xs opacity-80">Click to view</div>
                                    </div>
                                    {/* Overlay with moment info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                      {hasDescription && (
                                        <div className="text-white text-xs mb-1 line-clamp-2">
                                          {moment.description}
                                        </div>
                                      )}
                                      <div className="text-white/80 text-xs">
                                        {formatDate(moment.created_on)}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Text/Link only moment for desktop */
                                  <div className="bg-gray-50 dark:bg-gray-800 h-full p-3 flex flex-col justify-between">
                                    <div>
                                      {hasDescription && (
                                        <div className="text-gray-900 dark:text-white text-xs mb-2 leading-relaxed line-clamp-3">
                                          {moment.description}
                                        </div>
                                      )}
                                      {linkPreview && (
                                        <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
                                          {linkPreview.image_url && (
                                            <img
                                              src={linkPreview.image_url}
                                              alt={linkPreview.title}
                                              className="w-full h-16 object-cover"
                                            />
                                          )}
                                          <div className="p-1">
                                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                              {linkPreview.title}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                      {formatDate(moment.created_on)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
    </div>
  );
}
