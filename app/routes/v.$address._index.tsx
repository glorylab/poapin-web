import { useState } from "react";
import { useOutletContext } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";
// Components
import { FloatingFilterBar } from "~/components/poap/floating-filter-bar";
import { FloatingSortBar } from "~/components/poap/floating-sort-bar";
import { PoapGrid } from "~/components/poap/poap-grid";

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
        keywords: string;
        poaps: POAP[];
        address: string;
        ogimageurl: string;
    };
    totalMomentsCount: number;
    dropsWithMoments: number[];
}

export default function POAPIndex() {
    const { poaps, meta, totalMomentsCount, dropsWithMoments } = useOutletContext<OutletContext>();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const [selectedSort, setSelectedSort] = useState<string>("collected_newest");

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
        }, []),
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
        }, []),
    };

    const chainFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Chain",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            if (acc) {
                if (!acc.find((option) => option.value === poap.chain)) {
                    acc.push({ title: poap.chain, value: poap.chain });
                }
                return acc;
            }
            return [{ title: poap.chain, value: poap.chain }];
        }, []),
    };

    const yearFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Year",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            if (acc) {
                if (!acc.find((option) => option.value === poap.event.year.toString())) {
                    acc.push({ title: poap.event.year.toString(), value: poap.event.year.toString() });
                }
                return acc;
            }
            return [{ title: poap.event.year.toString(), value: poap.event.year.toString() }];
        }, []),
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
                    return values.includes(poap.event.year.toString());
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

    const handleFilterChange = (key: string, values: string[]) => {
        setSelectedFilters((prevFilters) => ({
            ...prevFilters,
            [key]: values,
        }));
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
                ]}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                allPoaps={poaps}
                filteredPoaps={filteredPoaps}
            />
            
            {/* Floating Sort Bar */}
            <FloatingSortBar
                selectedSort={selectedSort}
                onSortChange={setSelectedSort}
            />
            
            {/* Centered Main Content */}
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl flex-col">
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl mx-auto">
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
