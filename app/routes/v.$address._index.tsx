import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";
// Components
import { FloatingFilterBar } from "~/components/poap/floating-filter-bar";
import { FloatingSortBar } from "~/components/poap/floating-sort-bar";
import { PoapGrid } from "~/components/poap/poap-grid";
import { ActiveFiltersDisplay } from "~/components/poap/active-filters-display";

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
    
    // Get filter state from URL search params
    const getFiltersFromURL = (): { [key: string]: string[] } => {
        const filters: { [key: string]: string[] } = {};
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const filterKey = key.replace('filter_', '');
                filters[filterKey] = value.split(',').filter(v => v.length > 0);
            }
        }
        return filters;
    };
    
    const selectedFilters = getFiltersFromURL();
    const selectedSort = searchParams.get('sort') || 'collected_newest';

    // Handle removing a single filter
    const handleFilterRemove = (key: string, value: string) => {
        const newSearchParams = new URLSearchParams(searchParams);
        const currentValues = selectedFilters[key] || [];
        const newValues = currentValues.filter(v => v !== value);
        
        if (newValues.length > 0) {
            newSearchParams.set(`filter_${key}`, newValues.join(','));
        } else {
            newSearchParams.delete(`filter_${key}`);
        }
        
        setSearchParams(newSearchParams);
    };

    // Handle clearing all filters
    const handleClearAllFilters = () => {
        const newSearchParams = new URLSearchParams(searchParams);
        // Remove all filter parameters
        for (const [key] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                newSearchParams.delete(key);
            }
        }
        setSearchParams(newSearchParams);
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
        const newSearchParams = new URLSearchParams(searchParams);
        
        if (values.length > 0) {
            newSearchParams.set(`filter_${key}`, values.join(','));
        } else {
            newSearchParams.delete(`filter_${key}`);
        }
        
        try {
            setSearchParams(newSearchParams);
        } catch (error) {
            console.error('Error calling setSearchParams:', error);
        }
    };
    
    // Batch filter update function to handle multiple filters at once
    const handleBatchFilterChange = (filtersToUpdate: { [key: string]: string[] }) => {
        const newSearchParams = new URLSearchParams(searchParams);
        
        // Apply all filter changes to the same URLSearchParams object
        Object.entries(filtersToUpdate).forEach(([key, values]) => {
            if (values.length > 0) {
                newSearchParams.set(`filter_${key}`, values.join(','));
            } else {
                newSearchParams.delete(`filter_${key}`);
            }
        });
        
        try {
            setSearchParams(newSearchParams);
        
        try {
            setSearchParams(newSearchParams);
        } catch (error) {
            console.error('Error calling setSearchParams for batch update:', error);
        }
    };

    // Handle sort change
    const handleSortChange = (sort: string) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('sort', sort);
        setSearchParams(newSearchParams);
    };

    return (
        <>
            {/* Floating Filter Bar */}
            <FloatingFilterBar
                filters={[
                    countryFilter,
                    cityFilter,
                    yearFilter,
                    chainFilter,
                    momentsFilter,
                ]}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onBatchFilterChange={handleBatchFilterChange}
                allPoaps={poaps}
                filteredPoaps={filteredPoaps}
            />
            
            {/* Floating Sort Bar */}
            <FloatingSortBar
                selectedSort={selectedSort}
                onSortChange={handleSortChange}
            />
            
            {/* Centered Main Content */}
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl flex-col">
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl mx-auto">
                        {/* Active Filters Display */}
                        <ActiveFiltersDisplay
                            selectedFilters={selectedFilters}
                            onFilterRemove={handleFilterRemove}
                            onClearAll={handleClearAllFilters}
                        />
                        
                        <PoapGrid
                            poaps={filteredPoaps}
                            dropsWithMoments={dropsWithMoments}
                        />
                    </main>
                </div>
            </div>
        </>
    );
}
