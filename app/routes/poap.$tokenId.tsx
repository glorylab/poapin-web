import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getPoapActivity, getPoapToken } from "~/api/poap";
import POAPDetailItem from "~/components/poap/poap-detail-item";
import { POAPOwnerList } from "~/components/poap/poap-owner-list";
import { POAPActivityData } from "~/types/data";
import { POAPDetail } from "~/types/poap";

export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as LoaderData | undefined;

    if (!loaderData || !loaderData.meta) {
        return [];
    }

    const { title, description, keywords, poap } = loaderData.meta;

    const baseMeta = [
        { title },
        { description },
        { keywords },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://poap.in/poap/${poap.tokenId}` },
    ];

    const twitterMeta = [
        { name: "twitter:card", content: "summary" },
        { name: "twitter:domain", content: "poap.in" },
        { name: "twitter:url", content: `https://poap.in/poap/${poap.tokenId}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: poap.event.image_url }
    ];

    const imageMeta = [
        { property: "og:image", content: poap.event.image_url }
    ];
    return [...baseMeta, ...imageMeta, ...twitterMeta];
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

        const metaTitle = `${poap.event.name} - POAP #${poap.tokenId}`;
        const metaDescription = `${poap.event.description} - POAP #${poap.tokenId}`;

        const poapOwner = poap.owner ? `${poap.owner},` : "";
        const poapEventCountry = poap.event.country ? `${poap.event.country},` : "";
        const poapEventCity = poap.event.city ? `${poap.event.city},` : "";
        const poapEventStart = poap.event.start_date ? `${poap.event.start_date},` : "";
        const poapEventEnd = poap.event.end_date ? `${poap.event.end_date},` : "";
        const additionalKeywords = poap.event.name + "," + poapOwner + poapEventCountry + poapEventCity + poapEventStart + poapEventEnd;
        const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, ${additionalKeywords},`;

        const meta = {
            title: `${metaTitle}`,
            description: `${metaDescription}`,
            keywords: `${metaKeywords}`,
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


    if (!poap || !poap) {
        return <div className="loading">Loading POAP...</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <POAPDetailItem
                poap={poap}
                poapActivityData={poapActivityData}
                frontQuantity={frontQuantity}
                backQuantity={backQuantity}
            />

            <POAPOwnerList
                poapActivityData={poapActivityData}
                frontQuantity={frontQuantity}
                backQuantity={backQuantity} />
        </div>
    );
}