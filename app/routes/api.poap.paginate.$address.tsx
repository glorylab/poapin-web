import { LoaderFunction, json } from "@remix-run/cloudflare";
import { getPoapsOfAddress } from "~/lib/poap";

export const loader: LoaderFunction = async ({ context, params, request }) => {
    const address = params.address;
    
    if (!address) {
        return json({ error: "Address not found" }, { status: 400 });
    }

    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        console.log(`📄 Paginating POAPs for ${address}: limit=${limit}, offset=${offset}`);

        const { poaps, total } = await getPoapsOfAddress(context, address, limit, offset);

        return json({
            success: true,
            poaps,
            total,
            hasMore: offset + poaps.length < total
        });
    } catch (error) {
        console.error('Error in poap pagination API:', error);
        return json({
            success: false,
            error: "Failed to fetch POAPs",
            poaps: [],
            total: 0,
            hasMore: false
        }, { status: 500 });
    }
};