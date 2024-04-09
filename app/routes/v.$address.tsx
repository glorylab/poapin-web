import { POAP } from "~/types/poap";
import { getPoapsOfAddress } from "~/api/poap";
import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { cn } from "~/src/cn";
import PoapListItem from "~/components/poap/poap-list-item";
import { Spacer } from "@nextui-org/react";
import AddressInputComponent from "~/components/poap/address-input";
import { FrameMetadata, getFrameMetadata } from '@coinbase/onchainkit/frame';
import { getEnv } from "~/src/env";

export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as LoaderData | undefined;

    if (!loaderData || !loaderData.meta) {
        return [];
    }

    const { title, description, keywords, poaps, address, ogImageUrl } = loaderData.meta;

    const baseMeta = [
        { title },
        { description },
        { keywords },
        { property: "og:title", content: title },
        { property: "og:image", content: ogImageUrl },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://poap.in/v/${address}` },
    ];

    const twitterMeta = [
        { name: "twitter:card", content: "summary" },
        { name: "twitter:domain", content: "poap.in" },
        { name: "twitter:url", content: `https://poap.in/v/${address}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", ogImageUrl }
    ];

    const frameMeta = [getFrameMetadata({
        buttons: [
            {
                label: 'We love POAP',
            },
        ],
        image: ogImageUrl,
        postUrl: `https://poap.in/v/${address}`,
    })];

    return [...baseMeta, ...twitterMeta, ...frameMeta];
}

export const loader: LoaderFunction = async ({ context, params }) => {
    const address = params.address;

    if (!address) {
        return json({ error: "Address not found" }, { status: 404 });
    }

    try {
        const poaps: POAP[] = await getPoapsOfAddress(context, address);

        if (!poaps || !poaps.length) {
            return json({ error: "No POAPs found" }, { status: 404 });
        }
        const metaTitle = `POAPs of ${address}`;
        const titles = poaps.map(poap => poap.event.name).slice(0, 100);
        const metaDescription = `${address} has ${poaps.length} POAPs. POAP, short for "Proof of Attendance Protocol," allows you to mint memories as digital mementos we call "POAPs. POAPs are bookmarks for your life.`;
        const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, ${address}, ${titles.join(", ")}`;

        // Get the OG image
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

        if (!ogResponse.ok) {
            throw new Error(`Failed to fetch ogImage: ${ogResponse.statusText}`);
        }

        const ogImageUrl = ogResponse.url;
        const meta = {
            title: `${metaTitle}`,
            description: `${metaDescription}`,
            keywords: `${metaKeywords}`,
            poaps,
            address,
            ogImageUrl,
        };
        return json({ poaps, meta });
    } catch (error) {
        console.error(error);
        return json({ error: `Failed to fetch POAPs of ${address}` }, { status: 500 });
    }
};

interface LoaderData {
    poaps: POAP[];
    error: string;
    meta: {
        title: string;
        description: string;
        keywords: string;
        poaps: POAP[];
        address: string;
        ogImageUrl: string;
    };
}

export default function POAPList({ className }: { className?: string }) {
    const { poaps, error } = useLoaderData<LoaderData>();

    if (!poaps || !poaps.length) {
        if (error) {
            return (
                <div className="w-full flex flex-col items-center py-24">
                    <div className="relative flex flex-col items-center max-w-lg text-center">

                        <h2 className="font-medium leading-7 text-secondary-300">404</h2>
                        <h1 className="text-4xl font-medium tracking-tight text-background-800">{error}</h1>
                        <Spacer y={4} />
                        <h2 className="text-large text-background-700">
                            Check out other friends&apos; POAP 👇
                        </h2>
                    </div>
                    <Spacer y={4} />
                    <div className="relative flex flex-col items-center max-w-lg">
                        <AddressInputComponent />
                    </div>
                </div>
            );
        } else {
            return <div className="info">No POAPs found</div>;
        }
    }

    return (
        <div className="flex flex-col items-center">
            <div
                className={cn(
                    "my-auto grid max-w-7xl gap-5 p-4 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                    className
                )}
            >
                {poaps.map((poap) => (
                    <PoapListItem key={poap.tokenId} poap={poap} />
                ))}
            </div>
        </div>
    );
}