import { LoaderFunction, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getPoapToken } from "~/api/poap";
import POAPDetailItem from "~/components/poap/poap-detail-item";
import { POAPDetail } from "~/types/poap";

export const loader: LoaderFunction = async ({ context, params }) => {
    const tokenId = params.tokenId;

    if (!tokenId) {
        return json({ error: "POAP token not found" }, { status: 404 });
    }

    try {
        const poap = await getPoapToken(context, tokenId);
        return json(poap);
    } catch (error) {
        console.error(error);
        return json({ error: "Failed to fetch grants" }, { status: 500 });
    }
};

export default function POAPDetailPage() {
    const poap = useLoaderData<POAPDetail>();

    if (!poap || !poap) {
        return <div className="loading">Loading POAP...</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <POAPDetailItem poap={poap} event={poap.event} tokenId={poap.tokenId} owner={poap.owner} layer={poap.layer} created={poap.created} supply={{
                total: poap.supply.total,
                order: poap.supply.order
            }} />
        </div>
    );
}