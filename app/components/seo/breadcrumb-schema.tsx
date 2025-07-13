interface BreadcrumbSchemaProps {
    address: string;
}

export function BreadcrumbSchema({ address }: BreadcrumbSchemaProps) {
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://poap.in"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "POAP Profiles",
                "item": "https://poap.in/v"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": address,
                "item": `https://poap.in/v/${address}`
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
    );
}
