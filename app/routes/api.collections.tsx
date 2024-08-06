import { json, LoaderFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getCollectionsByDropIds } from "~/api/poap-graph";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
    const { params, context, request } = args;
    const { env } = context.cloudflare;
    const url = new URL(request.url);



    // Parse and validate dropIds
    const dropIdsParam = url.searchParams.get('dropIds');
    if (!dropIdsParam) {
        return json({ error: "dropIds parameter is required" }, { status: 400 });
    }
    const dropIds = dropIdsParam.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
    if (dropIds.length === 0) {
        return json({ error: "No valid drop IDs provided" }, { status: 400 });
    }

    // Parse and validate limit
    let limit = parseInt(url.searchParams.get('limit') || '', 10);
    if (isNaN(limit) || limit <= 0) {
        limit = 12; // Default value if not provided or invalid
    }

    // Parse and validate offset
    let offset = parseInt(url.searchParams.get('offset') || '', 10);
    if (isNaN(offset) || offset < 0) {
        offset = 0; // Default value if not provided or invalid
    }
    try {
        const collections = await getCollectionsByDropIds({ context, dropIds, limit, offset });
        return json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return json({ error: "An error occurred while fetching collections" }, { status: 500 });
    }
}
