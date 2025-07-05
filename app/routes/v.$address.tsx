import { Moment, POAP } from "~/types/poap";
import { RateLimitError, getPoapsOfAddress } from "~/api/poap";
import { Collection, getLastMomentsByAuthor, getMomentsCountByAuthor } from "~/api/poap-graph";
import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useDisclosure } from "@heroui/react";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import SidebarDrawer from "~/components/poap/sidebar-drawer";
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "app/types/filter";
import { useEffect, useState } from "react";
import { getEnv } from "~/src/env";
// Components
import FiltersWrapper from "~/components/poap/filters-wrapper";
import { JsonLdSchema } from "~/components/poap/json-ld-schema";
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
        { property: "og:title", content: title },
        { property: "og:image", content: ogimageurl },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://poap.in/v/${address}` },
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

        let latestMoments;
        let dropsWithMoments = [];

        // Get moments count
        const momentsCount = await getMomentsCountByAuthor({ context, author: ethAddress });
        dropsWithMoments = momentsCount.uniqueDropIds;
        if (momentsCount && momentsCount.totalMoments && momentsCount.totalMoments > 0) {
            // Get the latest moments
            latestMoments = await getLastMomentsByAuthor({ context, author: ethAddress, limit: 10 });
        }

        // Get the user agent
        const userAgent = request.headers.get("User-Agent") || "";

        // Check if the request is from a search engine bot
        const isSearchEngineBot = [
            'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider', 
            'applebot', 'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot',
            'embedly', 'quora link preview', 'showyoubot', 'outbrain', 'pinterest',
            'developers.google.com/+/web/snippet', 'discordbot', 'telegrambot', 'whatsapp',
            'slack', 'vkshare', 'w3c_validator', 'lighthouse', 'chrome-lighthouse'
        ].some(bot => userAgent.toLowerCase().includes(bot));

        let ogimageurl = "";

        // If the request is not from a search engine bot, get the OG image
        if (!isSearchEngineBot) {
            // Get the OG image
            const ogResponse = await fetch(`https://og.poap.in/api/poap/v/${address}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poaps,
                    latestMoments,
                    poapapikey: getEnv({ context }).poapApiKey,
                }),
            });

            if (!ogResponse.ok) {
                console.error(`Failed to fetch ogImage: ${ogResponse.statusText}`);
            }

            ogimageurl = ogResponse.url;
        }

        // Generate AI summary of the user's POAP collection
        let aiGeneratedSummary = "";
        let cachedTimestamp: string | null = null;
        try {
            // Check if we have access to the AI binding
            if (context.cloudflare && context.cloudflare.env) {
                // Use type assertion to access the AI binding and KV
                const env = context.cloudflare.env as Record<string, any>;

                // Get the ETH address from the POAPs
                const ethAddress = poaps[0].owner;

                // Check if we have a cached summary in KV
                let cachedSummary = null;

                // Try to get cached summary from KV if available
                const kvBinding = env.POAP_SUMMARIES_KV || env["POAP_SUMMARIES_KV"];

                if (kvBinding) {
                    // Try to get summary for the address parameter (could be ENS or ETH)
                    try {
                        // Get the cached data as JSON
                        const cachedData = await kvBinding.get(address, "json");

                        if (cachedData && typeof cachedData === 'object' && 'summary' in cachedData) {
                            cachedSummary = cachedData.summary as string;
                            // Set the generation timestamp from the cache
                            cachedTimestamp = cachedData.timestamp as string;
                        }
                    } catch (error) {
                        console.error("Error getting cached summary for", address, ":", error);
                    }

                    // If address is ENS and no cache found, try the ETH address
                    if (!cachedSummary && address !== ethAddress) {
                        try {
                            // Get the cached data as JSON
                            const cachedData = await kvBinding.get(ethAddress, "json");

                            if (cachedData && typeof cachedData === 'object' && 'summary' in cachedData) {
                                cachedSummary = cachedData.summary as string;
                                // Set the generation timestamp from the cache
                                cachedTimestamp = cachedData.timestamp as string;
                            }
                        } catch (error) {
                            console.error("Error getting cached summary for", ethAddress, ":", error);
                        }
                    }

                    if (cachedSummary) {
                        aiGeneratedSummary = cachedSummary;
                    } else {
                    }
                } else {
                    console.warn("KV binding not available. Check wrangler.toml and make sure the binding name matches.");
                }

                // If no cached summary found and AI is available, generate a new one
                if (!cachedSummary && env.AI) {
                    try {
                        // Get all event names
                        const allPoapEvents = poaps.map(p => p.event.name);
                        // Sort by event's supply
                        const sortedPoapEvents = allPoapEvents.sort((a, b) => {
                            const eventA = poaps.find(p => p.event.name === a);
                            const eventB = poaps.find(p => p.event.name === b);
                            return (eventB?.event.supply || 0) - (eventA?.event.supply || 0);
                        });

                        // Estimate token count for the prompt template (approximately)
                        const promptTemplateTokens = 400; // Base prompt without event names
                        const maxTokensForEvents = 7000; // Reserve some tokens for the response

                        // Estimate tokens for event names (rough estimate: 1.5 tokens per word)
                        let totalEventTokens = 0;
                        let includedEvents = [];

                        for (const eventName of sortedPoapEvents) {
                            // Rough estimate: 1.5 tokens per word + 2 for punctuation/formatting
                            const estimatedTokens = eventName.split(/\s+/).length * 1.5 + 2;

                            if (totalEventTokens + estimatedTokens <= maxTokensForEvents) {
                                includedEvents.push(eventName);
                                totalEventTokens += estimatedTokens;
                            } else {
                                break; // Stop adding events if we exceed the token limit
                            }
                        }

                        // Join the included events
                        const poapEvents = includedEvents.join(", ");

                        // Create a prompt for Llama model without predefined patterns
                        const prompt = `
                            You are an expert in analyzing NFT collections. I'm going to show you a POAP (Proof of Attendance Protocol) collection, and I need you to write a concise, personalized 1-2 sentence summary that describes the unique characteristics of this collection.
                            
                            POAP Collection for ${address}:
                            - Collection Size: ${getCollectionSizeDescription(poaps.length)}
                            - Event Names: ${poapEvents}
                            
                            Instructions:
                            1. Analyze the event names to identify unique patterns, themes, or interests
                            2. Write a concise, personalized 1-2 sentence summary that describes what makes this POAP collection unique
                            3. Focus on the specific events, locations, or themes that are distinctive to this collection
                            4. DO NOT start with phrases like "This collection is" or "This wallet demonstrates"
                            5. DO NOT include any prefixes like "Here is a summary:" - just provide the summary directly
                            6. DO NOT explain what POAPs are generally
                            7. DO NOT compare this collection to other collections (avoid phrases like "sets it apart from other collections")
                            8. Start directly with the unique aspects of the collection
                            9. Be specific about the events and themes you identify
                            10. Keep the focus entirely on this collection's characteristics without reference to others
                            11. DO NOT mention the exact number of POAPs in the collection
                        `;

                        // Check if AI binding exists and has the expected structure
                        let result;
                        if (typeof env.AI === 'object' && env.AI !== null) {
                            // Try different methods of accessing the AI binding
                            if (typeof env.AI.run === 'function') {
                                // Standard method
                                result = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
                                    prompt: prompt,
                                });
                            } else if (env.AI['@cf/meta/llama-3.2-3b-instruct'] && 
                                     typeof env.AI['@cf/meta/llama-3.2-3b-instruct'] === 'function') {
                                // Alternative method if model is directly accessible
                                result = await env.AI['@cf/meta/llama-3.2-3b-instruct']({
                                    prompt: prompt,
                                });
                            } else {
                                throw new Error('AI binding exists but does not have expected methods');
                            }
                        } else {
                            throw new Error('AI binding is not an object');
                        }

                        // Extract and clean the response from Llama
                        if (result && typeof result === 'object' && 'response' in result) {
                            let response = result.response;

                            // Remove common prefixes
                            const prefixesToRemove = [
                                "Here is a concise, personalized 1-2 sentence summary:",
                                "Here's a concise, personalized summary:",
                                "Here is my summary:",
                                "Summary:"
                            ];

                            for (const prefix of prefixesToRemove) {
                                if (response.includes(prefix)) {
                                    response = response.replace(prefix, "").trim();
                                }
                            }

                            // Remove newlines and extra spaces
                            response = response.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

                            // Remove quotes if present
                            response = response.replace(/^"|"$/g, "");

                            aiGeneratedSummary = response;

                            // Store the summary in KV cache if available
                            const kvBinding = env.POAP_SUMMARIES_KV || env["POAP_SUMMARIES_KV"];
                            if (kvBinding && aiGeneratedSummary) {
                                try {
                                    // Set expiration to one month (in seconds)
                                    const oneMonthInSeconds = 30 * 24 * 60 * 60;
                                    const expirationTtl = oneMonthInSeconds;

                                    // Create a data object with both summary and timestamp
                                    const dataToStore = {
                                        summary: aiGeneratedSummary,
                                        timestamp: new Date().toISOString()
                                    };

                                    // Store for the address parameter (could be ENS or ETH)
                                    await kvBinding.put(address, JSON.stringify(dataToStore), { expirationTtl });

                                    // If address is different from ETH address (likely an ENS), store for ETH address too
                                    if (address !== ethAddress) {
                                        await kvBinding.put(ethAddress, JSON.stringify(dataToStore), { expirationTtl });
                                    }

                                } catch (error) {
                                    console.error("Error storing summary in KV:", error);
                                }
                            } else {
                                console.warn("Cannot store summary in KV: binding not available or summary is empty");
                            }
                        }
                    } catch (error) {
                        console.error('Error generating AI summary:', error);
                    }
                }
            }
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

        // Get current timestamp for AI generation time
        const aiGenerationTimestamp = cachedTimestamp || (aiGeneratedSummary ? new Date().toISOString() : null);

        // Base description without AI summary
        let finalDescription = "";

        // Start with AI summary if available
        if (aiGeneratedSummary) {
            finalDescription = aiGeneratedSummary + " ";
        }

        // Add standard description
        finalDescription += `View ${address}'s collection of ${poaps.length} POAPs including ${poapTitles}${poaps.length > 1 ? " and more" : ""}. POAPs are digital mementos that serve as bookmarks for life experiences.`;

        // Add moments count if available
        const totalMomentsCount = momentsCount.totalMoments;
        if (momentsCount && totalMomentsCount && totalMomentsCount > 0) {
            finalDescription += ` ${address} created ${totalMomentsCount} POAP moments.`;
        }

        const meta = {
            title: `${metaTitle}`,
            description: finalDescription,
            keywords: `${metaKeywords}`,
            poaps,
            address,
            ogimageurl,
            aiSummary: aiGeneratedSummary || "",
            aiGenerationTime: aiGenerationTimestamp,
        };

        return json({ poaps, totalMomentsCount, latestMoments, dropsWithMoments, meta });
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

// Helper function to get a general description of collection size
function getCollectionSizeDescription(count: number): string {
    if (count < 5) return "A few POAPs";
    if (count < 10) return "Several POAPs";
    if (count < 20) return "A small collection";
    if (count < 50) return "A modest collection";
    if (count < 100) return "A medium-sized collection";
    if (count < 200) return "A substantial collection";
    if (count < 500) return "A large collection";
    if (count < 1000) return "A very large collection";
    return "An extensive collection";
}

// Helper function to format address for display
function formatDisplayAddress(address: string): string {
    // Check if address is an ENS name (contains a dot)
    if (address.includes('.')) {
        return address;
    }

    // Otherwise, it's an ETH address - truncate to first 4 and last 4 characters
    if (address.length >= 8) {
        return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    }

    // Fallback for very short addresses (shouldn't happen with ETH addresses)
    return address;
}

// Helper function to format timestamp in a user-friendly way
function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();

    // Calculate time difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format as relative time if recent, otherwise use date
    if (diffMins < 1) {
        return "Just now";
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
        // For older timestamps, use date format
        return date.toLocaleDateString();
    }
}

interface LoaderData {
    poaps: POAP[];
    totalMomentsCount: number;
    latestMoments: Moment[];
    dropsWithMoments: number[];
    error: string;
    isRateLimit?: boolean;
    address?: string;
    meta: {
        title: string;
        description: string;
        keywords: string;
        poaps: POAP[];
        address: string;
        ogimageurl: string;
        aiSummary: string;
        aiGenerationTime: string | null;
    };
}

export default function POAPList({ className }: { className?: string }) {
    const { poaps, meta, totalMomentsCount, latestMoments, dropsWithMoments, error, isRateLimit, address } = useLoaderData<LoaderData>();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const [selectedSort, setSelectedSort] = useState<string>("collected_newest");
    const [collections, setCollections] = useState<Collection[]>([]);

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
        return Object.entries(selectedFilters).every(([key, values]) => {
            if (values.length === 0) return true;
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
                    return true;
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
            <div className="flex gap-x-6 mb-8">
                <SidebarDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
                    <FiltersWrapper
                        className="md:bg-default-50 sm:ml-4 bg-transparent md:bg-opacity-30 backdrop-blur-sm min-w-64"
                        items={[
                            countryFilter,
                            cityFilter,
                            yearFilter,
                            chainFilter,
                        ]}
                        scrollShadowClassName="max-h-full pb-12"
                        showActions={false}
                        title="Filter by"
                        onFilterChange={handleFilterChange}
                    />
                </SidebarDrawer>
                <div className="w-full flex-1 flex-col">
                    <PageHeader
                        address={meta.address}
                        poapCount={poaps.length}
                        totalMomentsCount={totalMomentsCount}
                        selectedSort={selectedSort}
                        onSortChange={setSelectedSort}
                        onFilterOpen={onOpen}
                    />
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl">
                        <AiSummary
                            aiSummary={meta.aiSummary}
                            aiGenerationTime={meta.aiGenerationTime}
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