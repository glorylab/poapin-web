import { useEffect, useState } from "react";
import { POAP, Moment } from "~/types/poap";
import { RateLimitError, getPoapsOfAddress } from "~/lib/poap";
import { getMomentsCountFromGraphQL } from "~/utils/moments";
import { getMomentsCountByAuthor, Collection } from "~/lib/poap-graph";
import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { Outlet, useLoaderData, useParams, NavLink, useLocation } from "@remix-run/react";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { getEnv } from "~/src/env";
// State management
import { usePersistentPoapState } from "~/hooks/use-persistent-poap-state";
import { PlausibleEvents } from '~/utils/usePlausible';
// Components
import { JsonLdSchema } from "~/components/poap/json-ld-schema";
import { BreadcrumbSchema } from "~/components/seo/breadcrumb-schema";
import { ErrorState } from "~/components/poap/error-state";
import { AdvancedTabPreloader } from "~/components/poap/advanced-tab-preloader";
import { Chip } from "@heroui/react";

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
        { name: "title", content: title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { name: "author", content: address },
        { name: "theme-color", content: "#6366f1" },
        { name: "application-name", content: "POAPin" },

        { property: "og:locale", content: "en_US" },
        { property: "og:title", content: title },
        { property: "og:image", content: ogimageurl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: `${address}'s POAP collection visualization` },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "profile" },
        { property: "og:site_name", content: "POAPin" },
        { property: "profile:username", content: address },

        { rel: "canonical", href: canonicalUrl },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },
        { name: "msapplication-TileColor", content: "#6366f1" },
    ];

    const twitterMeta = [
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@glorylaboratory" },
        { name: "twitter:creator", content: "@glorylaboratory" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogimageurl },
        { name: "twitter:image:alt", content: `${address}'s POAP collection` },
        { name: "twitter:url", content: canonicalUrl },
        { name: "twitter:label1", content: "POAPs" },
        { name: "twitter:data1", content: loaderData.poaps?.length?.toString() || "0" },
        { name: "twitter:label2", content: "Moments" },
        { name: "twitter:data2", content: loaderData.totalMomentsCount?.toString() || "0" },
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

        // Get accurate moments count using POAP Graph API
        let totalMomentsCount = 0;
        let dropsWithMoments: number[] = [];
        try {
            totalMomentsCount = await getMomentsCountFromGraphQL(ethAddress, context);
        } catch (error) {
            console.error('Failed to fetch moments count:', error);
            totalMomentsCount = 0;
        }
        
        // Get basic moments count for SEO fallback (keep for dropsWithMoments)
        try {
            const momentsCount = await getMomentsCountByAuthor({ context, author: ethAddress });
            dropsWithMoments = momentsCount.uniqueDropIds;
        } catch (error) {
            console.error('Failed to fetch drops with moments:', error);
            dropsWithMoments = [];
        }

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
        if (totalMomentsCount && totalMomentsCount > 0) {
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

export default function POAPLayout() {
    const { poaps, meta, totalMomentsCount, dropsWithMoments, error, isRateLimit } = useLoaderData<LoaderData>();
    const { address } = useParams<{ address: string }>();
    const location = useLocation();

    // Handle tab click - scroll to top if already on that tab
    const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
        if (location.pathname === targetPath) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Track tab switching
            const fromTab = location.pathname.includes('/profile') ? 'profile' : 'index';
            const toTab = targetPath.includes('/profile') ? 'profile' : 'index';
            if (meta?.address) {
                PlausibleEvents.trackTabSwitch(fromTab, toTab, meta.address);
            }
        }
    };

    // Cached data for profile tab to avoid reloading
    const [collections, setCollections] = useState<Collection[]>([]);
    const [latestMoments, setLatestMoments] = useState<Moment[]>([]);
    const [aiSummary, setAiSummary] = useState<string>("");
    const [aiGenerationTime, setAiGenerationTime] = useState<string | null>(null);
    const [profileDataLoaded, setProfileDataLoaded] = useState(false);
    
    // Filter state for tracking filtered POAP count
    const [filteredPoapCount, setFilteredPoapCount] = useState<number>(poaps?.length || 0);
    
    // Unified state management - initialized once at parent level
    const poapState = usePersistentPoapState(meta.address);

    // Load profile data once and cache it
    useEffect(() => {
        if (!poaps || !poaps.length || error || profileDataLoaded) return;
        
        const loadProfileData = async () => {
            try {
                // Load AI summary and moments
                const extrasResponse = await fetch(`/api/poap/extras/${address}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (extrasResponse.ok) {
                    const extrasData: any = await extrasResponse.json();
                    setLatestMoments(extrasData.latestMoments || []);
                    setAiSummary(extrasData.aiSummary || "");
                    setAiGenerationTime(extrasData.aiGenerationTime);
                }

                // Load collections
                const dropIds = poaps.map(poap => poap.event.id);
                const queryParams = new URLSearchParams({ dropIds: dropIds.join(',') });
                const collectionsResponse = await fetch(`/api/collections?${queryParams}`);

                if (collectionsResponse.ok) {
                    const collectionsData: Collection[] = await collectionsResponse.json();
                    setCollections(collectionsData);
                }

                setProfileDataLoaded(true);
            } catch (error) {
                console.error('Error loading profile data:', error);
            }
        };

        loadProfileData();
    }, [poaps, address, error, profileDataLoaded]);

    if (error) {
        return <ErrorState error={error} isRateLimit={isRateLimit} address={address} onOpen={() => window.open(`https://poap.in/v/${address}`, '_blank')} />;
    }

    if (!poaps || !poaps.length) {
        return <div className="info">No POAPs found</div>;
    }

    const isProfileTab = location.pathname.endsWith('/profile');

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

            {/* Tab Navigation - Sticky below navbar */}
            <div className="sticky top-[60px] z-40 bg-white/10 backdrop-blur-sm border-b border-white/50 shadow-sm">
                <div className="flex justify-center">
                    <div className="w-full max-w-6xl px-4">
                        <nav className="flex space-x-8 justify-center">
                            <NavLink
                                to={`/v/${address}`}
                                end
                                prefetch="intent"
                                onClick={(e) => handleTabClick(e, `/v/${address}`)}
                                className={({ isActive }) =>
                                    `py-2 px-1 border-b-2 flex items-center gap-2 ${isActive
                                        ? 'border-primary-500 text-primary-600 font-bold'
                                        : 'border-transparent text-primary-500 hover:text-primary-600 hover:border-primary-500/50 font-medium'
                                    }`
                                }
                            >
                                <span className="text-xl">POAPs</span>
                                <Chip
                                    size="sm"
                                    classNames={{
                                        base: "bg-linear-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30",
                                        content: "drop-shadow-xs shadow-black text-white",
                                    }}
                                    variant="shadow"
                                >
                                    {filteredPoapCount !== poaps.length && filteredPoapCount < poaps.length 
                                        ? `${filteredPoapCount}/${poaps.length}` 
                                        : poaps.length
                                    }
                                </Chip>
                            </NavLink>
                            <NavLink
                                to={`/v/${address}/profile`}
                                prefetch="intent"
                                onClick={(e) => handleTabClick(e, `/v/${address}/profile`)}
                                className={({ isActive }) =>
                                    `py-2 px-1 border-b-2 flex items-center ${isActive
                                        ? 'border-primary-500 text-primary-600 font-bold'
                                        : 'border-transparent text-primary-500 hover:text-primary-600 hover:border-primary-500/50 font-medium'
                                    }`
                                }
                            >
                                <span className="text-xl">Profile</span>
                            </NavLink>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Advanced Tab Preloader */}
            <AdvancedTabPreloader 
                address={address || ''}
                currentTab={location.pathname.endsWith('/profile') ? 'profile' : 'index'}
                enabled={!error && !isRateLimit && poaps.length > 0}
            />

            {/* Child Route Content */}
            <Outlet context={{
                poaps,
                meta,
                totalMomentsCount,
                dropsWithMoments,
                // Cached profile data
                collections,
                latestMoments,
                aiSummary,
                aiGenerationTime,
                profileDataLoaded,
                // Filter state
                filteredPoapCount,
                setFilteredPoapCount,
                // Unified POAP state - prevents reset on tab switch
                poapState
            }} />
        </>
    );
}
