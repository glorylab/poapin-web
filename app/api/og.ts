import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { createDirectus, graphql, staticToken } from '@directus/sdk';
import { HighLight } from "~/types/og";

interface Schema {
    high_lights: HighLight[];
}

export async function getHighLights(context: AppLoadContext) {
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }

    try {
        const client = createDirectus<Schema>(directusUrl)
            .with(staticToken(apiKey))
            .with(graphql());

        const { highlights } = await client.query<{ highlights: HighLight[] }>(`
            query {
                highlights {
                    address
                    og_image_url
                    theme
                }
            }
        `);

        return { data: highlights };
    } catch (error) {
        console.error('Failed to fetch highlights:', error);
        throw new Error("Failed to fetch highlights");
    }
}