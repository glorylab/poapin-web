import type { POAP, Moment } from "~/types/poap";
import type { Collection } from "~/lib/poap-graph";

interface ProfileStructuredDataProps {
    address: string;
    poaps: POAP[];
    aiSummary: string;
    latestMoments: Moment[];
    collections: Collection[];
    totalMomentsCount: number;
}

export function ProfileStructuredData({
    address,
    poaps,
    aiSummary,
    latestMoments,
    collections,
    totalMomentsCount
}: ProfileStructuredDataProps) {
    // Person/Profile structured data
    const personSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": address,
        "identifier": address,
        "url": `https://poap.in/v/${address}/profile`,
        "sameAs": [
            `https://poap.in/v/${address}`,
        ],
        "description": `Web3 identity with ${poaps.length} POAPs and ${totalMomentsCount} moments`,
        "owns": {
            "@type": "Collection",
            "name": `${address}'s POAP Collection`,
            "description": `Collection of ${poaps.length} Proof of Attendance Protocol tokens`,
            "numberOfItems": poaps.length,
            "url": `https://poap.in/v/${address}`,
        }
    };

    // AI Summary as CreativeWork
    const aiSummarySchema = aiSummary ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": `${address} - AI Generated Profile Summary`,
        "description": "AI-generated insights about Web3 identity and POAP collection",
        "text": aiSummary,
        "about": {
            "@type": "Person",
            "name": address,
            "identifier": address
        },
        "creator": {
            "@type": "Organization",
            "name": "POAPin AI",
            "url": "https://poap.in"
        },
        "dateCreated": new Date().toISOString(),
        "inLanguage": "en-US"
    } : null;

    // Collections as CollectionPage
    const collectionsSchema = collections.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${address}'s POAP Collections`,
        "description": `Curated collections featuring ${address}'s POAPs`,
        "url": `https://poap.in/v/${address}/profile`,
        "mainEntity": {
            "@type": "Collection",
            "name": `${address}'s Collections`,
            "numberOfItems": collections.length,
            "about": collections.map(collection => ({
                "@type": "Thing",
                "name": collection.title || collection.id,
                "description": collection.description || `Collection ${collection.id}`,
            }))
        }
    } : null;

    // Latest Moments as ItemList
    const momentsSchema = latestMoments.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${address}'s Latest Moments`,
        "description": `Recent Web3 moments and activities by ${address}`,
        "numberOfItems": latestMoments.length,
        "itemListElement": latestMoments.slice(0, 5).map((moment, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "CreativeWork",
                "name": `Moment by ${address}`,
                "description": moment.description || "Web3 moment",
                "dateCreated": moment.created_on,
                "author": {
                    "@type": "Person",
                    "name": address
                }
            }
        }))
    } : null;

    const schemas = [personSchema, aiSummarySchema, collectionsSchema, momentsSchema].filter(Boolean);

    return (
        <>
            {schemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema)
                    }}
                />
            ))}
        </>
    );
}
