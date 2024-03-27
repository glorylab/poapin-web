import { POAP } from "~/types/poap";
import { getPoapsOfAddress } from "~/api/poap";
import { LoaderFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { cn } from "~/src/cn";
import PoapListItem from "~/components/poap/poap-list-item";


export const loader: LoaderFunction = async ({ context, params }) => {
    const address = params.address;

    if (!address) {
        return json({ error: "Address not found" }, { status: 400 });
    }

    try {
        const poaps = await getPoapsOfAddress(context, address);
        return json(poaps);
    } catch (error) {
        console.error(error);
        return json({ error: "Failed to fetch grants" }, { status: 500 });
    }
};


export default function POAPList({ className }: { className?: string }) {
    const poaps = useLoaderData<POAP[]>();

    if (!poaps || !poaps.length) {
        return <div className="loading">Loading POAPs...</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <div
                className={cn(
                    "my-auto grid max-w-7xl grid-cols-1 gap-5 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                    className
                )}
            >
                {poaps.map((poap) => (
                    <PoapListItem
                        key={poap.tokenId}
                        event={poap.event}
                        tokenId={poap.tokenId}
                        owner={poap.owner}
                        chain={poap.chain}
                        created={poap.created} />
                ))}
            </div>
        </div>
    );
}