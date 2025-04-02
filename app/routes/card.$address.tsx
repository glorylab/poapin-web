import { LoaderFunctionArgs, json, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";
import { AddressDisplay } from "~/components/card/address-display";
import { ResultBox } from "~/components/card/result-box";
import { motion } from "framer-motion";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { getEnv } from "~/src/env";

export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as LoaderData | undefined;

    if (!loaderData || !loaderData.meta) {
        return [];
    }

    const { title, description, address, ogimageurl } = loaderData.meta;

    const baseMeta = [
        { title },
        { description },
        { property: "og:title", content: title },
        { property: "og:image", content: ogimageurl },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://poap.in/card/${address}` },
    ];

    const twitterMeta = [
        { name: "X:card", content: "summary_large_image" },
        { name: "X:domain", content: "poap.in" },
        { name: "X:url", content: `https://poap.in/card/${address}` },
        { name: "X:title", content: title },
        { name: "X:description", content: description },
        { name: "X:image", content: ogimageurl }
    ];

    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                action: 'link',
                target: `https://poap.in/card`,
                label: 'Get my POAP card',
            },
        ],
        image: ogimageurl,
    });
    const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

    return [...baseMeta, ...twitterMeta, ...frameMeta];
};

interface LoaderData {
    address: string;
    meta?: {
        title: string;
        description: string;
        address: string;
        ogimageurl: string;
    };
}

export async function loader({ params, context }: LoaderFunctionArgs) {
    const address = params.address;
    if (!address) {
        throw new Response("Not Found", { status: 404 });
    }

    // Create meta information
    const metaTitle = `POAP Card for ${address} | POAPin`;
    const metaDescription = `Visualize your POAP collection in a beautiful way. Create your own POAP card and share it with the world.`;
    
    // Get the OG image URL
    const ogimageurl = `https://og.poap.in/api/poap/v/${address}/letter`;

    return json({
        address,
        meta: {
            title: metaTitle,
            description: metaDescription,
            address,
            ogimageurl,
        }
    });
}

export default function CardAddressPage() {
    const { address } = useLoaderData<typeof loader>();
    const [, setWalletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();

    useEffect(() => {
        setWalletAddress(address);
        setShowResults(true);
    }, [address, setWalletAddress, setShowResults]);

    const handleBack = () => {
        navigate("/card");
    };

    return (
        <div className="w-full mx-auto px-2 md:px-4 lg:px-8">
            <div className="max-w-2xl w-full mx-auto border-x-1 md:border-x-2 lg:border-x-4 border-yellow-400 border-solid shadow-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-neutral-50 p-8"
                >
                    <h2 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h2>
                    <AddressDisplay onBack={handleBack} />
                    <ResultBox walletAddress={address} />
                </motion.div>
            </div>
        </div>
    );
}
