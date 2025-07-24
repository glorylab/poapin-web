import { useOutletContext } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import type { POAP, Moment } from "~/types/poap";
import type { Collection } from "~/lib/poap-graph";
// Components
import { PageHeader } from "~/components/poap/page-header";
import { AiSummary } from "~/components/poap/ai-summary";
import { LatestMoments } from "~/components/poap/latest-moments";
import { CollectionsSection } from "~/components/poap/collections-section";
import { ExclusiveCards } from "~/components/poap/exclusive-cards";
import { ProfileStructuredData } from "~/components/seo/profile-structured-data";

export const meta: MetaFunction = ({ params, matches }) => {
    const parentMatch = matches.find(match => match.id === "routes/v.$address");
    const parentData = parentMatch?.data as any;
    const address = params.address;
    
    // Get parent data for fallbacks
    const parentMeta = parentData?.meta;
    const parentOgImage = parentMeta?.ogimageurl || `https://poap.in/api/og/${address}`;
    
    // Profile-specific meta
    const profileTitle = `${address} - Profile & Web3 Journey | POAPin`;
    const profileDescription = `Explore ${address}'s detailed Web3 profile including AI-generated insights, latest moments, POAP collections, and exclusive digital experiences.`;
    const canonicalUrl = `https://poap.in/v/${address}/profile`;
    
    const profileMeta = [
        { title: profileTitle },
        { name: "title", content: profileTitle },
        { name: "description", content: profileDescription },
        { name: "keywords", content: `${address}, profile, web3, POAP, moments, collections, AI insights, digital identity` },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        
        // Open Graph - Profile specific
        { property: "og:title", content: profileTitle },
        { property: "og:description", content: profileDescription },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "profile" },
        { property: "og:image", content: parentOgImage },
        { property: "og:image:alt", content: `${address}'s Web3 profile and POAP journey` },
        
        // Twitter Cards - Profile specific
        { name: "twitter:title", content: profileTitle },
        { name: "twitter:description", content: profileDescription },
        { name: "twitter:url", content: canonicalUrl },
        { name: "twitter:label1", content: "Profile Type" },
        { name: "twitter:data1", content: "Web3 Identity" },
        { name: "twitter:label2", content: "Platform" },
        { name: "twitter:data2", content: "POAPin" },
        
        // Canonical URL for profile
        { rel: "canonical", href: canonicalUrl },
        
        // Additional profile-specific meta
        { name: "author", content: address },
        { property: "profile:username", content: address },
        { name: "application-name", content: "POAPin Profile" },
    ];
    
    // Frame metadata for Farcaster
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                action: 'link',
                target: `https://poap.in/v/${address}/profile`,
                label: 'View Web3 Profile',
            },
        ],
        image: parentOgImage,
    });
    const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));
    
    return [...profileMeta, ...frameMeta];
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
    // Cached profile data
    collections: Collection[];
    latestMoments: Moment[];
    aiSummary: string;
    aiGenerationTime: string | null;
    profileDataLoaded: boolean;
}

export default function POAPProfile() {
    const { 
        poaps, 
        meta, 
        totalMomentsCount, 
        dropsWithMoments,
        collections,
        latestMoments,
        aiSummary,
        aiGenerationTime,
        profileDataLoaded
    } = useOutletContext<OutletContext>();

    if (!profileDataLoaded) {
        return (
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl px-4">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading profile data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Profile-specific structured data for SEO */}
            <ProfileStructuredData
                address={meta.address}
                poaps={poaps}
                aiSummary={aiSummary}
                latestMoments={latestMoments}
                collections={collections}
                totalMomentsCount={totalMomentsCount}
            />
            
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-6xl flex-col">
                    <PageHeader
                        address={meta.address}
                        poapCount={poaps.length}
                        totalMomentsCount={totalMomentsCount}
                    />
                    <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl mx-auto">
                        <AiSummary
                            aiSummary={aiSummary}
                            aiGenerationTime={aiGenerationTime}
                            address={meta.address}
                        />
                        <LatestMoments latestMoments={latestMoments} />
                        <CollectionsSection collections={collections} />
                        <ExclusiveCards address={meta.address} />
                    </main>
                </div>
            </div>
        </>
    );
}
