import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { POAPData } from "~/types/data";

export async function getPoapsOfAddress(context: AppLoadContext, address: string) {
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`https://api.poap.tech/actions/scan/${address}`, {
        headers: {
            accept: "application/json",
            "x-api-key": getEnv({ context }).poapApiKey,
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch poaps");
    }
    return await res.json<POAPData>();
}

export async function getPoapToken(context: AppLoadContext, tokenId: string) {
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`https://api.poap.tech/token/${tokenId}`, {
        headers: {
            accept: "application/json",
            "x-api-key": getEnv({ context }).poapApiKey,
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch poap");
    }
    return await res.json<POAPData>();
}