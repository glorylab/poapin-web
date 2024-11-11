// api.assets.$.tsx
import { LoaderFunction } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";

export const loader: LoaderFunction = async ({ request, params, context }) => {
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const filename = params["*"];

        const assetUrl = `${directusUrl}/assets/${filename}?access_token=${apiKey}`;

        const response = await fetch(assetUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch asset: ${response.statusText}`);
        }

        const headers = new Headers(response.headers);

        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Asset proxy error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
};