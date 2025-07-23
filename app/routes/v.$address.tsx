import { Moment, POAP } from "~/types/poap";
import { RateLimitError, getPoapsOfAddress } from "~/lib/poap";
import { Collection, getMomentsCountByAuthor } from "~/lib/poap-graph";
import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "app/types/filter";
import { useEffect, useState } from "react";
import { getEnv } from "~/src/env";
// Components
import { FloatingFilterBar } from "~/components/poap/floating-filter-bar";
import { FloatingSortBar } from "~/components/poap/floating-sort-bar";
import { JsonLdSchema } from "~/components/poap/json-ld-schema";
import { BreadcrumbSchema } from "~/components/seo/breadcrumb-schema";
import { ErrorState } from "~/components/poap/error-state";
import { AiSummary } from "~/components/poap/ai-summary";
import { LatestMoments } from "~/components/poap/latest-moments";
import { CollectionsSection } from "~/components/poap/collections-section";
import { ExclusiveCards } from "~/components/poap/exclusive-cards";
import { PageHeader } from "~/components/poap/page-header";
import { PoapGrid } from "~/components/poap/poap-grid";


export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as LoaderData | undefined;

    if (!loaderData || !loaderData.meta) {
        return [];
    }

    const { title, description, keywords, address, ogimageurl } = loaderData.meta;

    // Get the ETH address from the loader data for the canonical URL
    const ethAddress = loaderData.poaps && loaderData.poaps.length > 0
        ? loaderData.poaps[0].owner
        : address;

    const canonicalUrl = `https://poap.in/v/${ethAddress}`;

    const baseMeta = [
        { title },
        { description },
        { keywords },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { name: "author", content: address },
        { name: "theme-color", content: "#6366f1" },
        { name: "application-name", content: "POAPin" },
        { property: "og:title", content: title },
        { property: "og:image", content: ogimageurl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: `${address}'s POAP collection visualization` },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `https://poap.in/v/${address}` },
        { property: "og:locale", content: "en_US" },
        { tagName: "link", rel: "canonical", href: canonicalUrl },
    ];

    const twitterMeta = [
        { name: "X:card", content: "summary_large_image" },
        { name: "X:domain", content: "poap.in" },
        { name: "X:url", content: `https://poap.in/v/${address}` },
        { name: "X:title", content: title },
        { name: "X:description", content: description },
        { name: "X:image", ogimageurl }
    ];

    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                action: 'link',
                target: `https://poap.in/v/${address}`,
                label: 'We love POAP',
            },
        ],
        image: ogimageurl,
    })
    const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

    return [...baseMeta, ...twitterMeta, ...frameMeta];
}

export const loader: LoaderFunction = async ({ context, params, request }) => {
    const address = params.address;

    if (!address) {
        return json({ error: "Address not found" }, { status: 404 });
    }

    try {
        const poaps: POAP[] = await getPoapsOfAddress(context, address);

        if (!poaps || !poaps.length) {
            return json({ error: "No POAPs found" }, { status: 404 });
        }

        // Get the eth address from any of the poaps owner
        const ethAddress = poaps[0].owner;

        let metaTitle = `POAPs of ${address} | POAPin`;

        if (ethAddress != address) {
            metaTitle = `POAPs of ${address} (${ethAddress}) | POAPin`;
        }

        const poapTitles = poaps.slice(0, 1).map(poap => poap.event.name).join(", ");
        const metaDescription = `View ${address}'s collection of ${poaps.length} POAPs including ${poapTitles}${poaps.length > 1 ? " and more" : ""}. POAPs are digital mementos that serve as bookmarks for life experiences.`;
        const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, ${address}, ${poapTitles}`;

        // Get basic moments count for SEO (but defer detailed moments loading)
        const momentsCount = await getMomentsCountByAuthor({ context, author: ethAddress });
        const dropsWithMoments = momentsCount.uniqueDropIds;
        const totalMomentsCount = momentsCount.totalMoments;

        // Generate OG image on server-side (needed immediately for display and SEO)
        let ogImageUrl = "";
        try {
            const ogResponse = await fetch(`https://og.poap.in/api/poap/v/${address}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poaps,
                    poapapikey: getEnv({ context }).poapApiKey,
                }),
            });

            if (ogResponse.ok) {
                ogImageUrl = ogResponse.url;
            }
        } catch (error) {
            console.error('Error generating OG image:', error);
        }

        // Create base description for SEO (AI summary will be added client-side)
        let finalDescription = `View ${address}'s collection of ${poaps.length} POAPs including ${poapTitles}${poaps.length > 1 ? " and more" : ""}. POAPs are digital mementos that serve as bookmarks for life experiences.`;
        
        // Add moments count if available
        if (momentsCount && totalMomentsCount && totalMomentsCount > 0) {
            finalDescription += ` ${address} created ${totalMomentsCount} POAP moments.`;
        }

        const meta = {
            title: `${metaTitle}`,
            description: finalDescription,
            keywords: `${metaKeywords}`,
            poaps,
            address,
            ogimageurl: ogImageUrl
        };

        // Return critical data immediately (non-critical data loaded client-side)
        return json({ 
            poaps, 
            totalMomentsCount, 
            dropsWithMoments, 
            meta
        });
    } catch (error) {
        console.error('Error in v.$address loader:', error);

        // Check if it's a rate limit error
        if (error instanceof RateLimitError) {
            return json({
                error: error.message,
                isRateLimit: true,
                address: address
            }, { status: 429 });
        }

        // Handle other errors
        return json({
            error: "Failed to load POAPs. Please try again later.",
            address: address
        }, { status: 500 });
    }
};

interface LoaderData {
    poaps: POAP[];
    totalMomentsCount: number;
    dropsWithMoments: number[];
    error?: string;
    isRateLimit?: boolean;
    address?: string;
    meta: {
        title: string;
        description: string;
        keywords: string;
        poaps: POAP[];
        address: string;
        ogimageurl: string;
    };
}

export default function POAPList({ className }: { className?: string }) {
    const { poaps, meta, totalMomentsCount, dropsWithMoments, error, isRateLimit } = useLoaderData<LoaderData>();
    const { address } = useParams<{ address: string }>();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const [selectedSort, setSelectedSort] = useState<string>("collected_newest");
    const [collections, setCollections] = useState<Collection[]>([]);
    const [latestMoments, setLatestMoments] = useState<Moment[]>([]);
    const [aiSummary, setAiSummary] = useState<string>("");
    const [aiGenerationTime, setAiGenerationTime] = useState<string | null>(null);

    // Load deferred data (AI summary, latest moments, OG image)
    useEffect(() => {
        if (!poaps || !poaps.length || error) return;
        
        const loadExtrasData = async () => {
            try {
                const response = await fetch(`/api/poap/extras/${address}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    const extrasData: any = await response.json();
                    setLatestMoments(extrasData.latestMoments || []);
                    setAiSummary(extrasData.aiSummary || "");
                    setAiGenerationTime(extrasData.aiGenerationTime);
                } else {
                    console.error('API response not ok:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error loading deferred data:', error);
            }
        };
        
        loadExtrasData();
    }, [poaps, address, error]);

    // Load collections data
    useEffect(() => {
        if (!poaps || !poaps.length || error) return;

        const fetchCollections = async () => {
            const dropIds = poaps.map(poap => poap.event.id);
            const queryParams = new URLSearchParams({ dropIds: dropIds.join(',') });
            try {
                const response = await fetch(`/api/collections?${queryParams}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch collections');
                }
                const data: Collection[] = await response.json();
                setCollections(data);
            } catch (error) {
                console.error('Error fetching collections:', error);
            }
        };

        fetchCollections();
    }, [poaps]);

    if (error) {
        return <ErrorState error={error} isRateLimit={isRateLimit} address={address} onOpen={onOpen} />;
    }

    if (!poaps || !poaps.length) {
        return <div className="info">No POAPs found</div>;
    }

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
            {/* Add JSON-LD structured data */}
            {meta && <JsonLdSchema meta={meta} poaps={poaps} />}
            {meta && <BreadcrumbSchema address={meta.address} />}
            
            {/* Page header for SEO */}
            <header className="sr-only">
                <h1>{meta.title}</h1>
                <p>{meta.description}</p>
            </header>
            
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
                    <PageHeader
                        address={meta.address}
                        poapCount={poaps.length}
                        totalMomentsCount={totalMomentsCount}
                    />
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl">
                        <AiSummary
                            aiSummary={aiSummary}
                            aiGenerationTime={aiGenerationTime}
                            address={meta.address}
                        />
                        <LatestMoments latestMoments={latestMoments} />
                        <CollectionsSection collections={collections} />
                        <ExclusiveCards address={meta.address} />
                        <PoapGrid
                            poaps={filteredPoaps}
                            dropsWithMoments={dropsWithMoments}
                            className={className}
                        />
                    </main>
                </div>
            </div>
        </>

    );
}