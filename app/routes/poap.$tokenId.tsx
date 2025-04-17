import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getPoapActivity, getPoapToken } from "~/api/poap";
import POAPDetailItem from "~/components/poap/poap-detail-item";
import { POAPOwnerList } from "~/components/poap/poap-owner-list";
import { POAPActivityData } from "~/types/data";
import { POAPDetail } from "~/types/poap";
import { formatISO8601Date } from "~/utils/date-utils";

export const meta: MetaFunction = ({ data, params, location }) => {
    const loaderData = data as LoaderData | undefined;
    const canonicalUrl = `https://poap.in/poap/${params.tokenId}`;

    if (!loaderData || !loaderData.meta) {
        return [
            { title: "POAP Not Found | POAPin" },
            { description: "The requested POAP token could not be found." },
            { tagName: "link", rel: "canonical", href: canonicalUrl },
            { name: "robots", content: "noindex, follow" }
        ];
    }

    const { title, description, keywords, poap } = loaderData.meta;

    const baseMeta = [
        { title },
        { description },
        { keywords },
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { tagName: "link", rel: "canonical", href: canonicalUrl },
        { name: "robots", content: "index, follow" },
        { name: "author", content: "POAPin" },
    ];

    const ogMeta = [
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: poap.event.image_url },
        { property: "og:image:alt", content: `POAP image for ${poap.event.name}` },
    ];

    const xMeta = [
        { name: "x:card", content: "summary_large_image" },
        { name: "x:domain", content: "poap.in" },
        { name: "x:url", content: canonicalUrl },
        { name: "x:title", content: title },
        { name: "x:description", content: description },
        { name: "x:image", content: poap.event.image_url }
    ];

    return [...baseMeta, ...ogMeta, ...xMeta];
}

interface LoaderData {
    poap: POAPDetail;
    poapActivityData: POAPActivityData;
    frontQuantity: number;
    backQuantity: number;
    error: string;
    meta: {
        title: string;
        description: string;
        keywords: string;
        poap: POAPDetail;
    };
}


export const loader: LoaderFunction = async ({ context, params }) => {
    const tokenId = params.tokenId;

    if (!tokenId) {
        return json({ error: "POAP token not found" }, { status: 404 });
    }

    try {
        const poap = await getPoapToken(context, tokenId);

        const metaTitle = `${poap.event.name} (POAP #${poap.tokenId}) | POAPin`;
        
        let metaDescription = poap.event.description;
        if (poap.event.city || poap.event.country) {
            metaDescription += ` This event took place in ${poap.event.city ? poap.event.city + ", " : ""}${poap.event.country || ""}`;  
        }
        if (poap.event.start_date) {
            const eventDate = poap.event.end_date && poap.event.end_date !== poap.event.start_date 
                ? `from ${poap.event.start_date} to ${poap.event.end_date}` 
                : `on ${poap.event.start_date}`;
            metaDescription += ` ${eventDate}.`;
        }
        metaDescription += ` View this POAP token and explore its details on POAPin.`;
        
        if (metaDescription.length > 160) {
            metaDescription = metaDescription.substring(0, 157) + "...";
        }

        const poapOwner = poap.owner ? `${poap.owner},` : "";
        const poapEventCountry = poap.event.country ? `${poap.event.country},` : "";
        const poapEventCity = poap.event.city ? `${poap.event.city},` : "";
        const poapEventStart = poap.event.start_date ? `${poap.event.start_date},` : "";
        const poapEventEnd = poap.event.end_date ? `${poap.event.end_date},` : "";
        const additionalKeywords = poap.event.name + "," + poapOwner + poapEventCountry + poapEventCity + poapEventStart + poapEventEnd;
        const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, ${additionalKeywords},`;

        const meta = {
            title: metaTitle,
            description: metaDescription,
            keywords: metaKeywords,
            poap,
        };

        const order = poap.supply.order;
        const supply = poap.supply.total;
        const reserveOrder = supply - order;

        let offset = 0;

        // Try to make the current POAP the 5th out of 9 POAPs. 
        // If the total supply is less than ten, then the offset is 0.
        if (supply > 9) {
            offset = Math.max(0, reserveOrder - 4);
        }

        // Based on supply, order, and the current displayed quantity, 
        // calculate how many POAPs are in front and behind.
        let frontQuantity = 0;
        let backQuantity = 0;

        if (supply > 9) {
            frontQuantity = Math.max(0, supply - order - 4);
            backQuantity = Math.max(0, order - 5);
        }

        const poapActivityData = { data: await getPoapActivity(context, poap.event.id, offset, 9) };

        return json({
            poap,
            poapActivityData,
            frontQuantity,
            backQuantity,
            meta
        });
    } catch (error) {
        console.error(error);
        return json({ error: "Failed to fetch grants" }, { status: 500 });
    }
};

export default function POAPDetailPage() {
    const { poap, poapActivityData, frontQuantity, backQuantity } = useLoaderData<LoaderData>();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": poap?.event?.name,
        "description": poap?.event?.description,
        "url": `https://poap.in/poap/${poap?.tokenId}`,
        "mainEntity": {
            "@type": "VisualArtwork",
            "name": poap?.event?.name,
            "description": poap?.event?.description,
            "creator": {
                "@type": "Organization",
                "name": "POAP - Proof of Attendance Protocol"
            },
            "artform": "Digital Token",
            "artMedium": "NFT",
            "image": poap?.event?.image_url,
            "dateCreated": poap?.event?.start_date ? formatISO8601Date(poap.event.start_date) : undefined,
            ...(poap?.owner ? {
                "owner": {
                    "@type": "Person",
                    "identifier": poap.owner
                }
            } : {}),
            "isPartOf": {
                "@type": "Event",
                "name": poap?.event?.name,
                "description": poap?.event?.description,
                "startDate": poap?.event?.start_date ? formatISO8601Date(poap.event.start_date) : undefined,
                "endDate": poap?.event?.end_date ? formatISO8601Date(poap.event.end_date) : 
                          (poap?.event?.start_date ? formatISO8601Date(poap.event.start_date) : undefined),
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "image": poap?.event?.image_url,
                ...(poap?.event?.city || poap?.event?.country ? {
                    "location": {
                        "@type": "Place",
                        "name": [poap?.event?.city, poap?.event?.country].filter(Boolean).join(", "),
                        "address": {
                            "@type": "PostalAddress",
                            ...(poap?.event?.city ? { "addressLocality": poap.event.city } : {}),
                            ...(poap?.event?.country ? { "addressCountry": poap.event.country } : {})
                        }
                    }
                } : {
                    "location": {
                        "@type": "Place",
                        "name": "Digital Event",
                        "address": {
                            "@type": "PostalAddress",
                            "addressCountry": "Online"
                        }
                    }
                }),
                ...(poap?.event?.event_url ? { "url": poap.event.event_url } : {}),
                "organizer": {
                    "@type": "Organization",
                    "name": "POAP - Proof of Attendance Protocol",
                    "url": "https://poap.xyz/"
                },
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock",
                    "url": `https://poap.in/poap/${poap?.tokenId}`,
                    "validFrom": poap?.event?.start_date ? formatISO8601Date(poap.event.start_date) : new Date().toISOString().split('T')[0]
                },
                "performer": {
                    "@type": "Organization",
                    "name": "POAP - Proof of Attendance Protocol"
                }
            },
            "additionalProperty": [
                {
                    "@type": "PropertyValue",
                    "name": "tokenId",
                    "value": poap?.tokenId
                },
                {
                    "@type": "PropertyValue",
                    "name": "supply",
                    "value": poap?.supply?.total
                },
                {
                    "@type": "PropertyValue",
                    "name": "order",
                    "value": poap?.supply?.order
                }
            ]
        }
    };

    if (!poap) {
        return <div className="loading">Loading POAP...</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <script 
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            <h1 className="sr-only">{poap.event.name} - POAP #{poap.tokenId}</h1>
            
            <article aria-labelledby="poap-details-heading">
                <header className="sr-only">
                    <h2 id="poap-details-heading">POAP Details</h2>
                </header>
                <POAPDetailItem
                    poap={poap}
                    poapActivityData={poapActivityData}
                    frontQuantity={frontQuantity}
                    backQuantity={backQuantity}
                />
            </article>

            <section aria-labelledby="poap-owners-heading">
                <header className="sr-only">
                    <h2 id="poap-owners-heading">POAP Owners</h2>
                    <p>List of wallets that own this POAP token</p>
                </header>
                <POAPOwnerList
                    poapActivityData={poapActivityData}
                    frontQuantity={frontQuantity}
                    backQuantity={backQuantity} 
                />
            </section>
        </div>
    );
}