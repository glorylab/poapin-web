import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useSearchParams } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { useAtom } from 'jotai';
import { filterStateAtom, sortStateAtom } from '~/atoms/filter-atoms';
import { timeCapsuleModeAtom } from '~/atoms/time-capsule-atoms';
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";
import { Button, ButtonGroup } from "@heroui/react";
import { Icon } from '@iconify/react';
// Components
import { FloatingFilterBar } from "~/components/poap/floating-filter-bar";
import { FloatingSortBar } from "~/components/poap/floating-sort-bar";
import { PoapGrid } from "~/components/poap/poap-grid";
import { ActiveFiltersDisplay } from "~/components/poap/active-filters-display";
import { MomentsTimeline } from "~/components/poap/moments-timeline";

export const meta: MetaFunction = ({ params, matches }) => {
    const parentMatch = matches.find(match => match.id === "routes/v.$address");
    const parentData = parentMatch?.data as any;
    const address = params.address;

    // Get parent data for fallbacks
    const parentMeta = parentData?.meta;
    const poapCount = parentData?.poaps?.length || 0;
    const parentOgImage = parentMeta?.ogimageurl || `https://poap.in/api/og/${address}`;

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
    const [searchParams, setSearchParams] = useSearchParams();

    // View state - 'classic' or 'timeline'
    const [filters, setFilters] = useAtom(filterStateAtom);
    const [sortBy, setSortBy] = useAtom(sortStateAtom);
    const [isTimeCapsuleMode, setIsTimeCapsuleMode] = useAtom(timeCapsuleModeAtom);

    // Animation states for view transitions
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showClassic, setShowClassic] = useState(!isTimeCapsuleMode);
    const [showTimeline, setShowTimeline] = useState(isTimeCapsuleMode);

    // Sync animation states when Time Capsule mode changes externally
    useEffect(() => {
        if (!isTransitioning) {
            setShowClassic(!isTimeCapsuleMode);
            setShowTimeline(isTimeCapsuleMode);
        }
    }, [isTimeCapsuleMode, isTransitioning]);

    // Handle animated view transition
    const handleViewTransition = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);

        if (!isTimeCapsuleMode) {
            // Transitioning to timeline: start fade out animation, then switch mode
            setShowClassic(false);  // Trigger fade out animation

            setTimeout(() => {
                setIsTimeCapsuleMode(true);  // Update global state for background
                setShowTimeline(true);       // Show timeline
            }, 300); // Wait for fade out

            setTimeout(() => {
                setIsTransitioning(false);
            }, 800); // Complete transition
        } else {
            // Transitioning to classic: fade out timeline, then fade in classic
            setShowTimeline(false);

            setTimeout(() => {
                setIsTimeCapsuleMode(false); // Update global state for background
                setShowClassic(true);        // Show classic
            }, 300); // Wait for fade out

            setTimeout(() => {
                setIsTransitioning(false);
            }, 800); // Complete transition
        }
    }, [isTimeCapsuleMode, isTransitioning, setIsTimeCapsuleMode]);

    // Auto-activate time capsule if URL parameter is present and conditions are met
    useEffect(() => {
        const autoTimeCapsule = searchParams.get('auto_time_capsule');
        console.log('🔍 Auto time capsule check:', {
            autoTimeCapsule,
            totalMomentsCount,
            isTimeCapsuleMode,
            isTransitioning,
            shouldActivate: autoTimeCapsule === 'true' && totalMomentsCount > 0 && !isTimeCapsuleMode && !isTransitioning
        });
        
        if (autoTimeCapsule === 'true' && totalMomentsCount > 0 && !isTimeCapsuleMode && !isTransitioning) {
            console.log('✅ Auto-activating time capsule in 2 seconds...');
            
            // Remove the query parameter from URL to clean it up
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('auto_time_capsule');
            const newURL = window.location.pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            window.history.replaceState({}, '', newURL);
            
            // Auto-activate time capsule after 2 seconds
            const timer = setTimeout(() => {
                if (!isTimeCapsuleMode && !isTransitioning) {
                    console.log('🚀 Auto-activating time capsule now!');
                    handleViewTransition();
                }
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [searchParams, totalMomentsCount, isTimeCapsuleMode, isTransitioning, handleViewTransition]);

    // Get filter state from URL search params
    const getFiltersFromURL = (): { [key: string]: string[] } => {
        const filters: { [key: string]: string[] } = {};
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const filterKey = key.replace('filter_', '');
                filters[filterKey] = value.split(',').filter(v => v.trim() !== '');
            }
        }
        return filters;
    };

    // Global filter and sort state using Jotai
    const [globalFilters, setGlobalFilters] = useAtom(filterStateAtom);
    const [globalSort, setGlobalSort] = useAtom(sortStateAtom);

    // Sync global state with URL on mount and URL changes
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        const urlSort = searchParams.get('sort') || 'collected_newest';

        // Only update global state if URL has different values (to avoid infinite loops)
        const filtersChanged = JSON.stringify(urlFilters) !== JSON.stringify(globalFilters);
        const sortChanged = urlSort !== globalSort;

        if (filtersChanged) {
            setGlobalFilters(urlFilters);
        }
        if (sortChanged) {
            setGlobalSort(urlSort);
        }
    }, [searchParams, globalFilters, globalSort, setGlobalFilters, setGlobalSort]);

    // Helper function to update URL without trailing '?' when no parameters
    const updateURL = (searchParams: URLSearchParams) => {
        const queryString = searchParams.toString();
        const newURL = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    };

    const selectedFilters = globalFilters;
    const selectedSort = globalSort;

    // Handle removing a single filter
    const handleFilterRemove = (key: string, value: string) => {
        const currentValues = selectedFilters[key] ?? [];
        const newValues = currentValues.filter(v => v !== value);

        // Update global state immediately for instant UI feedback
        setGlobalFilters(prev => ({
            ...prev,
            [key]: newValues
        }));

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);
        if (newValues.length > 0) {
            newSearchParams.set(`filter_${key}`, newValues.join(','));
        } else {
            newSearchParams.delete(`filter_${key}`);
        }

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    };

    // Handle clearing all filters
    const handleClearAllFilters = () => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters({});

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        // Remove all filter parameters
        for (const [key] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                newSearchParams.delete(key);
            }
        }

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    };

    // Create filters
    const countryFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Country",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const country = poap.event.country || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === country)) {
                    acc.push({ title: country, value: country });
                }
                return acc;
            }
            return [{ title: country, value: country }];
        }, [] as Filter["options"]),
    };

    const cityFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "City",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const city = poap.event.city || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === city)) {
                    acc.push({ title: city, value: city });
                }
                return acc;
            }
            return [{ title: city, value: city }];
        }, [] as Filter["options"]),
    };

    const yearFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Year",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const year = new Date(poap.created).getFullYear().toString();
            if (acc) {
                if (!acc.find((option) => option.value === year)) {
                    acc.push({ title: year, value: year });
                }
                return acc;
            }
            return [{ title: year, value: year }];
        }, [] as Filter["options"]).sort((a, b) => b.value.localeCompare(a.value)),
    };

    const chainFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Chain",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const chain = poap.chain || "mainnet";
            if (acc) {
                if (!acc.find((option) => option.value === chain)) {
                    acc.push({ title: chain, value: chain });
                }
                return acc;
            }
            return [{ title: chain, value: chain }];
        }, [] as Filter["options"]),
    };

    const momentsFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Moments",
        options: [
            { title: "Has Moments", value: "has_moments" },
            { title: "No Moments", value: "no_moments" },
        ],
    };

    // Filter and sort POAPs
    const filteredPoaps = poaps.filter((poap) => {
        // Get all active filter entries (with non-empty values)
        const activeFilters = Object.entries(selectedFilters).filter(([key, values]) => values.length > 0);

        // If no filters are active, show all POAPs
        if (activeFilters.length === 0) return true;

        // Check if POAP matches ANY of the active filter values (OR logic)
        return activeFilters.some(([key, values]) => {
            switch (key) {
                case "Country":
                    return values.includes(poap.event.country || "(None)");
                case "City":
                    return values.includes(poap.event.city || "(None)");
                case "Chain":
                    return values.includes(poap.chain);
                case "Year":
                    return values.includes(new Date(poap.created).getFullYear().toString());
                case "Moments":
                    const hasMoments = dropsWithMoments.includes(poap.event.id);
                    if (values.includes("has_moments") && hasMoments) return true;
                    if (values.includes("no_moments") && !hasMoments) return true;
                    return false;
                default:
                    return false;
            }
        });
    }).sort((a, b) => {
        switch (selectedSort) {
            case "collected_newest":
                return new Date(b.created).getTime() - new Date(a.created).getTime();
            case "collected_oldest":
                return new Date(a.created).getTime() - new Date(b.created).getTime();
            case "start_date_newest":
                return new Date(b.event.start_date).getTime() - new Date(a.event.start_date).getTime();
            case "start_date_oldest":
                return new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime();
            case "most_moments":
                // Use inline function since getMomentsCountOfDrop was moved to utils
                const getMomentsCount = (poap: POAP) => dropsWithMoments.includes(poap.event.id) ? 1 : 0;
                return getMomentsCount(b) - getMomentsCount(a);
            case "most_popular":
                return b.event.supply - a.event.supply;
            default:
                return new Date(b.created).getTime() - new Date(a.created).getTime();
        }
    });

    // Update parent component with filtered count whenever filters or sort change
    useEffect(() => {
        setFilteredPoapCount(filteredPoaps.length);
    }, [filteredPoaps.length, setFilteredPoapCount]);

    const handleFilterChange = (key: string, values: string[]) => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters((prev: { [key: string]: string[] }) => ({
            ...prev,
            [key]: values
        }));

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        if (values.length > 0) {
            newSearchParams.set(`filter_${key}`, values.join(','));
        } else {
            newSearchParams.delete(`filter_${key}`);
        }

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    };

    // Batch filter update function to handle multiple filters at once
    const handleBatchFilterChange = (filtersToUpdate: { [key: string]: string[] }) => {
        // Update global state immediately for instant UI feedback
        setGlobalFilters(filtersToUpdate);

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);

        // Apply all filter changes to the same URLSearchParams object
        Object.entries(filtersToUpdate).forEach(([key, values]) => {
            if (values.length > 0) {
                newSearchParams.set(`filter_${key}`, values.join(','));
            } else {
                newSearchParams.delete(`filter_${key}`);
            }
        });

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    };

    // Handle sort change
    const handleSortChange = (sort: string) => {
        // Update global state immediately for instant UI feedback
        setGlobalSort(sort);

        // Update URL asynchronously for sharing
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('sort', sort);

        // Use replace to avoid triggering route reload
        updateURL(newSearchParams);
    };

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
                    selectedSort={selectedSort}
                    onSortChange={handleSortChange}
                />
            )}

            {/* Centered Main Content */}
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl flex-col">
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl mx-auto">
                        {/* Time Capsule Toggle - only show if there are moments */}
                        {totalMomentsCount > 0 && (
                            <div className="flex justify-center items-center mb-6">
                                <Button
                                    variant={isTimeCapsuleMode ? "solid" : "flat"}
                                    startContent={!isTimeCapsuleMode ? <Icon icon="fluent:timeline-20-filled" className={`w-6 h-6 ${isTimeCapsuleMode ? 'text-white' : ''}`} /> : <Icon icon="fluent:grid-20-filled" className={`w-6 h-6 ${isTimeCapsuleMode ? 'text-white' : ''}`} />}
                                    onClick={handleViewTransition}
                                    size="lg"
                                    className={`px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 ${isTimeCapsuleMode
                                            ? 'bg-gradient-to-r from-background-600 to-background-600 text-white border-2 border-background-400/50'
                                            : 'text-white border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                                        }`}
                                    disabled={isTransitioning}
                                >
                                    <div className="flex flex-col items-start py-2 gap-1">
                                        <span className="text-sm opacity-80">
                                            {!isTimeCapsuleMode ?
                                                <div><span className="font-semibold font-mono">{totalMomentsCount}</span> Moments</div> :
                                                <div><span className="font-semibold font-mono">{poaps.length}</span> POAPs</div>}
                                        </span>
                                        <span className="text-xl font-semibold">
                                            {!isTimeCapsuleMode ? 'Open Time Capsule' : 'Back to Classic View'}
                                        </span>
                                    </div>
                                </Button>
                            </div>
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
