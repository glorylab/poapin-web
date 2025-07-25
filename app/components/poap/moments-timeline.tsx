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

  // Create interleaved timeline structure
  const timelineStructure: (typeof allTimelineItems[0] | typeof allTimelineItems[0][])[] = [];
  let currentBatch: typeof allTimelineItems[0][] = [];

  allTimelineItems.forEach((item, index) => {
    if (item.hasMoments) {
      // If we have accumulated POAPs without moments, add them as a batch first
      if (currentBatch.length > 0) {
        timelineStructure.push([...currentBatch]);
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
    timelineStructure.push(currentBatch);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-3">Loading moments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => fetchMoments()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
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
              if (Array.isArray(segment)) {
                // This is a batch of POAPs without moments - smart layout: flat row or poker-card stacking
                const totalItems = segment.length;
                const cardWidth = 128; // 32 * 4 = 128px (w-32)
                const cardGap = 16; // gap between cards when flat
                const availableWidth = containerWidth; // Dynamic container width
                const flatRowWidth = totalItems * cardWidth + (totalItems - 1) * cardGap;
                
                // Decide layout: flat row if fits, otherwise poker-card stacking
                const useFlat = flatRowWidth <= availableWidth;
                
                if (useFlat) {
                  // Flat row layout
                  return (
                    <div key={`batch-${segmentIndex}`} className="my-8">
                      <div className="flex gap-4 justify-center">
                        {segment.map((item, index) => {
                          // const opacity = 1 - (index * 0.8) / (totalItems - 1); // From 1 to 0.2
                          const opacity = 1; // Fixed opacity for all cards

                          return (
                            <div
                              key={`poap-${item.poap.event.id}`}
                              className="w-32 h-32 flex-shrink-0 aspect-square transition-all duration-300 hover:scale-95"
                              style={{
                                opacity: Math.max(opacity, 0.2)
                              }}
                              title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                            >
                              <Card className="w-full h-full p-0 overflow-hidden shadow-none hover:shadow-xl transition-shadow rounded-full">
                                <img
                                  src={item.poap.event.image_url}
                                  alt={item.poap.event.name}
                                  className="w-full h-full object-cover"
                                />
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  // Poker-card stacking layout
                  const maxSpread = 800; // Maximum spread width for stacking
                  const stackWidth = Math.min(maxSpread, availableWidth - cardWidth);
                  const stepSize = totalItems > 1 ? stackWidth / (totalItems - 1) : 0;
                  
                  return (
                    <div key={`batch-${segmentIndex}`} className="my-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      <div 
                        className="relative mx-auto" 
                        style={{ width: `${cardWidth + stackWidth}px`, height: '128px' }}
                      >
                        {segment.map((item, index) => {
                          const zIndex = totalItems - index; // First item has highest z-index
                          const offsetX = index * stepSize; // Evenly distributed from left to right
                          // const opacity = 1 - (index * 0.8) / (totalItems - 1); // From 1 to 0.2
                          const opacity = 1; // Fixed opacity for all cards
                          return (
                            <div
                              key={`poap-${item.poap.event.id}`}
                              className="absolute top-0 w-32 h-32 flex-shrink-0 aspect-square transition-all duration-300 hover:scale-95"
                              style={{
                                left: `${offsetX}px`,
                                zIndex: zIndex,
                                opacity: Math.max(opacity, 0.2)
                              }}
                              title={`${item.poap.event.name} - ${formatDate(item.poap.event.start_date)}`}
                            >
                              <Card className="w-full h-full p-0 overflow-hidden shadow-none hover:shadow-xl transition-shadow rounded-full">
                                <img
                                  src={item.poap.event.image_url}
                                  alt={item.poap.event.name}
                                  className="w-full h-full object-cover"
                                />
                              </Card>
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
                  <Card key={`poap-with-moments-${item.poap.event.id}`} className="overflow-hidden">
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
