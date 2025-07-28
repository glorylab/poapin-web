import { useEffect } from "react";
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
import { useViewTransition } from "~/hooks/use-view-transition";
import { useUrlSync } from "~/hooks/use-url-sync";
import { useAutoTimeCapsule } from "~/hooks/use-auto-time-capsule";
import { useFilterHandlers } from "~/hooks/use-filter-handlers";
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
    const canonicalUrl = `https://poap.in/v/${address}`;

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
}

export default function POAPIndex() {
    const { poaps, meta, totalMomentsCount, dropsWithMoments, filteredPoapCount, setFilteredPoapCount } = useOutletContext<OutletContext>();
    
    // Use custom hooks for state management
    const { isTimeCapsuleMode, isTransitioning, showClassic, showTimeline, handleViewTransition } = useViewTransition();
    const { globalFilters, globalSort } = useUrlSync();
    const {
        handleFilterRemove,
        handleClearAllFilters,
        handleFilterChange,
        handleBatchFilterChange,
        handleSortChange
    } = useFilterHandlers();
    
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

    // Filter and sort POAPs using utility functions
    const filteredPoaps = sortPoaps(
        filterPoaps(poaps, globalFilters, dropsWithMoments),
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
                    onFilterChange={handleFilterChange}
                    onBatchFilterChange={handleBatchFilterChange}
                    allPoaps={poaps}
                    filteredPoaps={filteredPoaps}
                />
            )}

            {/* Floating Sort Bar - only show in classic mode */}
            {!isTimeCapsuleMode && (
                <FloatingSortBar
                    selectedSort={globalSort}
                    onSortChange={handleSortChange}
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
                            />
                        )}

                        {/* Active Filters Display - with smooth animation */}
                        {!isTimeCapsuleMode && (
                            <div className={`transition-all duration-300 ease-in-out transform ${showClassic
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-90'
                                }`}>
                                <ActiveFiltersDisplay
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
                                    poaps={poaps}
                                />
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
