import { useEffect, useState } from "react";
import { useOutletContext } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import type { POAP } from "~/types/poap";
// Components
import { FloatingFilterBar } from "~/components/poap/floating-filter-bar";
import { FloatingSortBar } from "~/components/poap/floating-sort-bar";
import { PoapGrid } from "~/components/poap/poap-grid";
import { ActiveFiltersDisplay } from "~/components/poap/active-filters-display";
import { MomentsTimeline } from "~/components/poap/moments-timeline";
import { TimeCapsuleButton } from "~/components/poap/time-capsule-button";
// Hooks
import { useAutoTimeCapsule } from "~/hooks/use-auto-time-capsule";
import { useTabPreloader } from "~/hooks/use-tab-preloader";
// Utils
import { filterPoaps, sortPoaps } from "~/utils/poap-filter-sort";
import {
    createCountryFilter,
    createCityFilter,
    createYearFilter,
    createChainFilter,
    createMomentsFilter
} from "~/utils/filter-configs";

export const meta: MetaFunction = ({ params, matches }) => {
    const parentMatch = matches.find(match => match.id === "routes/v.$address");
    const parentData = parentMatch?.data as any;
    const address = params.address;

    // Get parent data for fallbacks
    const parentMeta = parentData?.meta;
    const poapCount = parentData?.poaps?.length || 0;
    const parentOgImage = parentMeta?.ogimageurl || `https://og.poap.in/api/poap/v/${address}`;

    // POAP collection specific meta
    const collectionTitle = `${address} - ${poapCount} POAPs Collection | POAPin`;
    const collectionDescription = `Browse ${address}'s complete POAP collection of ${poapCount} tokens. Filter by country, city, chain, and year. Discover their Web3 journey through proof of attendance.`;
    // Prefer ENS for canonical if provided; fallback to ETH owner address
    const ethAddress = parentData?.poaps && parentData.poaps.length > 0 ? parentData.poaps[0].owner : address;
    const hasEns = typeof address === 'string' && address.includes('.')
    const canonicalAddress = hasEns ? address : (ethAddress || address);
    const canonicalUrl = `https://poap.in/v/${canonicalAddress}`;

    const collectionMeta = [
        { title: collectionTitle },
        { name: "title", content: collectionTitle },
        { name: "description", content: collectionDescription },
        { name: "keywords", content: `${address}, POAP, collection, NFT, Web3, proof of attendance, ${poapCount} tokens` },
        { name: "robots", content: "index, follow, max-image-preview:large" },

        // Open Graph - Collection specific
        { property: "og:title", content: collectionTitle },
        { property: "og:description", content: collectionDescription },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: parentOgImage },
        { property: "og:image:alt", content: `${address}'s POAP collection of ${poapCount} tokens` },

        // Twitter Cards - Collection specific
        { name: "twitter:title", content: collectionTitle },
        { name: "twitter:description", content: collectionDescription },
        { name: "twitter:url", content: canonicalUrl },
        { name: "twitter:label1", content: "POAPs" },
        { name: "twitter:data1", content: poapCount.toString() },
        { name: "twitter:label2", content: "Collection" },
        { name: "twitter:data2", content: "Web3 Identity" },

        // Canonical URL for collection
        { rel: "canonical", href: canonicalUrl },

        // Collection-specific meta
        { name: "author", content: address },
        { name: "application-name", content: "POAPin Collection" },
    ];

    // Frame metadata for Farcaster
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                action: 'link',
                target: `https://poap.in/v/${address}`,
                label: 'We love POAP',
            },
        ],
        image: parentOgImage,
    });
    const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

    return [...collectionMeta, ...frameMeta];
};

interface OutletContext {
    poaps: POAP[];
    totalPoapCount: number;
    meta: {
        title: string;
        description: string;
        address: string;
        ogimageurl: string;
    };
    totalMomentsCount: number;
    dropsWithMoments: number[];
    filteredPoapCount: number;
    setFilteredPoapCount: (count: number) => void;
    // Unified state from parent
    poapState: ReturnType<typeof import('~/hooks/use-persistent-poap-state').usePersistentPoapState>;
}

export default function POAPIndex() {
    const { 
        poaps, 
        totalPoapCount,
        meta, 
        totalMomentsCount: serverMomentsCount, 
        dropsWithMoments, 
        filteredPoapCount, 
        setFilteredPoapCount,
        poapState 
    } = useOutletContext<OutletContext>();
    
    // Client-side moments count state (since server-side is now 0 for performance)
    const [clientMomentsCount, setClientMomentsCount] = useState<number>(0);
    const [isFetchingMoments, setIsFetchingMoments] = useState(false);
    const [hasFetchedMoments, setHasFetchedMoments] = useState(false);
    
    // Pagination state for infinite scroll
    const [allPoaps, setAllPoaps] = useState<POAP[]>(poaps);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMorePoaps, setHasMorePoaps] = useState(totalPoapCount > poaps.length);
    
    // Load more POAPs function
    const loadMorePoaps = async () => {
        if (isLoadingMore || !hasMorePoaps) return;
        
        setIsLoadingMore(true);
        try {
            const response = await fetch(`/api/poap/paginate/${meta.address}?limit=100&offset=${allPoaps.length}`);
            const data = await response.json();
            
            if (data.success && data.poaps.length > 0) {
                setAllPoaps(prev => [...prev, ...data.poaps]);
                setHasMorePoaps(data.hasMore);
            } else {
                setHasMorePoaps(false);
            }
        } catch (error) {
            console.error('Failed to load more POAPs:', error);
            setHasMorePoaps(false);
        } finally {
            setIsLoadingMore(false);
        }
    };
    
    // Reset pagination when address changes
    useEffect(() => {
        setAllPoaps(poaps);
        setHasMorePoaps(totalPoapCount > poaps.length);
    }, [poaps, totalPoapCount]);
    
    // Infinite scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                loadMorePoaps();
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [allPoaps.length, hasMorePoaps, isLoadingMore]);
    
    // Use client-side count if available, fallback to server-side
    const totalMomentsCount = clientMomentsCount > 0 ? clientMomentsCount : serverMomentsCount;
    
    // Use unified state from parent (prevents reset on tab switch)
    const {
        filters: globalFilters,
        sort: globalSort,
        timeCapsuleMode: isTimeCapsuleMode,
        isTransitioning,
        showClassic,
        showTimeline,
        hasActiveFilters,
        activeFilterCount,
        handleFilterRemove,
        clearAllFilters: handleClearAllFilters,
        handleFilterChange,
        handleBatchFilterChange,
        handleSortChange,
        handleViewTransition,
        isInitialized
    } = poapState;
    
    // Tab preloading for better UX
    const { isPreloading } = useTabPreloader({
        address: meta.address,
        currentTab: 'index',
        delay: 1500, // Start preloading after 1.5s
        enabled: !isTimeCapsuleMode // Don't preload during animations
    });
    
    // Fetch moments count client-side after page load using internal API
    useEffect(() => {
        const fetchMomentsCount = async () => {
            if (isFetchingMoments || hasFetchedMoments) return;
            
            setIsFetchingMoments(true);
            console.log(`🔍 Fetching moments count client-side for: ${meta.address}`);
            
            try {
                // Get ETH address from POAPs if available
                const ethAddress = poaps.length > 0 ? poaps[0].owner : meta.address;
                
                // Use internal API route for security
                const response = await fetch(`/api/moments-count/${ethAddress}`);
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }
                
                const data: any = await response.json();
                
                if (data.success) {
                    setClientMomentsCount(data.totalMomentsCount);
                } else {
                    console.error('API returned error:', data.error);
                    setClientMomentsCount(0);
                }
            } catch (error) {
                console.error('Failed to fetch moments count client-side:', error);
                setClientMomentsCount(0);
            } finally {
                setIsFetchingMoments(false);
                setHasFetchedMoments(true); // Mark as fetched regardless of success/failure
            }
        };
        
        // Only fetch if we have POAPs and haven't fetched yet
        if (poaps.length > 0 && !isFetchingMoments && !hasFetchedMoments) {
            fetchMomentsCount();
        }
    }, [poaps, meta.address, isFetchingMoments, hasFetchedMoments]);
    
    // Auto-activate time capsule hook
    useAutoTimeCapsule({
        totalMomentsCount,
        isTimeCapsuleMode,
        isTransitioning,
        handleViewTransition
    });

    // Create filters using utility functions
    const countryFilter = createCountryFilter(poaps);
    const cityFilter = createCityFilter(poaps);
    const yearFilter = createYearFilter(poaps);
    const chainFilter = createChainFilter(poaps);
    const momentsFilter = createMomentsFilter();

    // Filter and sort POAPs using utility functions (use all loaded POAPs)
    const filteredPoaps = sortPoaps(
        filterPoaps(allPoaps, globalFilters, dropsWithMoments),
        globalSort,
        dropsWithMoments
    );

    // Update parent component with filtered count whenever filters or sort change
    useEffect(() => {
        setFilteredPoapCount(filteredPoaps.length);
    }, [filteredPoaps.length, setFilteredPoapCount]);

    return (
        <>
            {/* Floating Filter Bar - only show in classic mode */}
            {!isTimeCapsuleMode && (
                <FloatingFilterBar
                    filters={[
                        countryFilter,
                        cityFilter,
                        yearFilter,
                        chainFilter,
                        momentsFilter,
                    ]}
                    selectedFilters={globalFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onFilterChange={handleFilterChange}
                    onBatchFilterChange={handleBatchFilterChange}
                    allPoaps={allPoaps}
                    filteredPoaps={filteredPoaps}
                    address={meta.address}
                />
            )}

            {/* Floating Sort Bar - only show in classic mode */}
            {!isTimeCapsuleMode && (
                <FloatingSortBar
                    selectedSort={globalSort}
                    onSortChange={handleSortChange}
                    address={meta.address}
                />
            )}

            {/* Centered Main Content */}
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl flex-col">
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl mx-auto">
                        {/* Time Capsule Toggle - only show if there are moments */}
                        {totalMomentsCount > 0 && (
                            <TimeCapsuleButton
                                isTimeCapsuleMode={isTimeCapsuleMode}
                                isTransitioning={isTransitioning}
                                totalMomentsCount={totalMomentsCount}
                                totalPoapsCount={poaps.length}
                                onToggle={handleViewTransition}
                                address={meta.address}
                            />
                        )}

                        {/* Active Filters Display - with smooth animation */}
                        {!isTimeCapsuleMode && (
                            <div className={`transition-all duration-300 ease-in-out transform ${showClassic
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-90'
                                }`}>
                                <ActiveFiltersDisplay
                                    filters={globalFilters}
                                    hasActiveFilters={hasActiveFilters}
                                    activeFilterCount={activeFilterCount}
                                    onFilterRemove={handleFilterRemove}
                                    onClearAll={handleClearAllFilters}
                                />
                            </div>
                        )}

                        {/* Classic Grid View with smooth animation */}
                        {!isTimeCapsuleMode && (
                            <div className={`transition-all duration-300 ease-in-out transform ${showClassic
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-90'
                                }`}>
                                <PoapGrid
                                    poaps={filteredPoaps}
                                    dropsWithMoments={dropsWithMoments}
                                />
                            </div>
                        )}

                        {/* Timeline View with smooth animation */}
                        {isTimeCapsuleMode && (
                            <div className={`transition-all duration-500 ease-in-out transform ${showTimeline
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-90'
                                }`}>
                                <MomentsTimeline
                                    address={meta.address}
                                    poaps={allPoaps}
                                    momentsCache={poapState.momentsCache}
                                    updateMomentsCache={poapState.updateMomentsCache}
                                    appendMoments={poapState.appendMoments}
                                    modalState={poapState.modalState}
                                    openModal={poapState.openModal}
                                    closeModal={poapState.closeModal}
                                />
                            </div>
                        )}

                        {/* Infinite Scroll Loading Indicators - only show in classic mode */}
                        {!isTimeCapsuleMode && (
                            <div className="mt-8 mb-16 flex justify-center">
                                {isLoadingMore ? (
                                    <div className="flex items-center space-x-3 text-gray-500">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                        <span className="text-sm">Loading more POAPs...</span>
                                    </div>
                                ) : !hasMorePoaps && allPoaps.length > 0 ? (
                                    <div className="text-gray-400 text-sm">
                                        End of collection ({allPoaps.length} POAPs total)
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
