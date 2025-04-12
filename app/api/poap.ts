import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { POAP, POAPActivity, POAPDetail } from "~/types/poap";

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

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
        if (res.status === 429) {
            // Get retry-after header if available
            const retryAfter = res.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter, 10) : 60; // Default to 60 seconds if not specified
            throw new RateLimitError(`Rate limit exceeded. Please try again in ${waitTime} seconds.`);
        }
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

export async function getPoapActivity(context: AppLoadContext, eventId: number, offset: number, limit: number): Promise<POAPActivity> {
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }
    const res = await fetch(`https://api.poap.tech/event/${eventId}/poaps?offset=${offset}&limit=${limit}`, {
        headers: {
            accept: "application/json",
            "x-api-key": getEnv({ context }).poapApiKey,
            "charset": "utf-8",
        }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch poap activity");
    }
    return await res.json();
}