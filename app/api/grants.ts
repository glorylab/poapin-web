import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { GrantData } from "~/types/data";

export async function getGrants(context: AppLoadContext) {
    const apiKey = getEnv({ context }).poapinReadApiKey;
    const pylonBaseUrl = getEnv({ context }).pylonBaseUrl;
    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`${pylonBaseUrl}/poapin-grants?populate[grants][populate]=*&populate[image][populate]=*`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "charset": "utf-8",
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch grants");
    }
    return await res.json<GrantData>();
}