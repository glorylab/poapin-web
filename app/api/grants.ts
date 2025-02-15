import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { createDirectus, graphql, staticToken } from '@directus/sdk';
import { Grant } from "~/types/grant";

interface Schema {
    grants: Grant[];
}

export async function getGrants(context: AppLoadContext) {
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;
    
    if (!apiKey) {
        throw new Error("API key not found");
    }

    try {
        const client = createDirectus<Schema>(directusUrl)
            .with(staticToken(apiKey))
            .with(graphql());
        
        const { grants } = await client.query<{ grants: Grant[] }>(`
            query {
                grants {
                    id
                    status
                    title
                    description
                    image {
                        id
                        filename_disk
                        type
                        filesize
                        width
                        height
                    }
                    start_time
                    end_time
                    rounds {
                        grant_rounds_id {
                            id
                            title
                            description
                            donor_counts
                            amount {
                                amount_id {
                                    id
                                    number
                                    quantity
                                }
                            }
                        }
                    }
                }
            }
        `);

        const grantsWithImageUrls = grants.map(grant => ({
            ...grant,
            image: {
                ...grant.image,
                url: `/api/assets/${grant.image.filename_disk}`
            }
        }));

        return { data: grantsWithImageUrls };
    } catch (error) {
        console.error('Failed to fetch grants:', error);
        throw new Error("Failed to fetch grants");
    }
}