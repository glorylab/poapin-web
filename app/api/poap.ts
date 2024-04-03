import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { POAPData } from "~/types/data";
import { POAP, POAPDetail } from "~/types/poap";

export async function getPoapsOfAddress(context: AppLoadContext, address: string): Promise<POAP[]> {
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`https://api.poap.tech/actions/scan/${address}`, {
        headers: {
            accept: "application/json",
            "x-api-key": getEnv({ context }).poapApiKey,
            "charset": "utf-8",
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch poaps");
    }
    return await res.json();
}

export async function getPoapToken(context: AppLoadContext, tokenId: string): Promise<POAPDetail> {
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`https://api.poap.tech/token/${tokenId}`, {
        headers: {
            accept: "application/json",
            "x-api-key": getEnv({ context }).poapApiKey,
            "charset": "utf-8",
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch poap");
    }
    return await res.json();
}