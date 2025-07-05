import { POAP } from "~/types/poap";

interface JsonLdSchemaProps {
    meta: {
        address: string;
        description: string;
    };
    poaps: POAP[];
}

export function JsonLdSchema({ meta, poaps }: JsonLdSchemaProps) {
    const jsonLd = [
        // Person schema for the wallet owner
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "identifier": meta.address,
            "name": meta.address.includes('.') ? meta.address : `Ethereum Wallet ${meta.address}`,
            "description": meta.description,
            "url": `https://poap.in/v/${meta.address}`,
            "mainEntityOfPage": {
                "@type": "ProfilePage",
                "@id": `https://poap.in/v/${meta.address}`
            },
            "owns": {
                "@type": "ItemList",
                "itemListElement": poaps?.slice(0, 10).map((poap) => ({
                    "@type": "Thing",
                    "name": poap.event.name,
                    "url": `https://poap.in/poap/${poap.tokenId}`
                }))
            }
        },
        // ItemList schema for the POAP collection (enhanced version of existing schema)
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${meta.address}'s POAP Collection`,
            "description": `Collection of POAPs (Proof of Attendance Protocol) owned by ${meta.address}`,
            "numberOfItems": poaps.length,
            "itemListOrder": "Descending",
            "itemListElement": poaps?.slice(0, 10).map((poap, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `https://poap.in/poap/${poap.tokenId}`,
                "name": poap.event.name,
                "image": poap.event.image_url,
                "description": `${poap.event.name} POAP from ${poap.event.start_date}`
            }))
        }
    ];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
