import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { POAP, POAPActivity, POAPDetail } from "~/types/poap";
import { getTokensByOwner, getTokenById, getCollectorsByDropId } from "~/lib/poap-graph";
import { resolveAddress } from "~/utils/ens-resolver";

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

export async function getPoapsOfAddress(context: AppLoadContext, address: string): Promise<POAP[]> {
    console.log(`🌐 Fetching POAPs from GraphQL: ${address}`);
    
    try {
        // Resolve address (ENS to ETH address if needed)
        const ethAddress = await resolveAddress(address, context);
        
        if (!ethAddress) {
            throw new Error(`Failed to resolve address: ${address}`);
        }
        
        // Use GraphQL API to get POAPs
        const poaps = await getTokensByOwner({
            context,
            owner: ethAddress
        });
        
        return poaps;
    } catch (error) {
        console.error('Error fetching POAPs from GraphQL:', error);
        throw error;
    }
}

export async function getPoapToken(context: AppLoadContext, tokenId: string): Promise<POAPDetail> {
    console.log(`🌐 Fetching POAP token from GraphQL: ${tokenId}`);
    
    try {
        return await getTokenById({
            context,
            tokenId
        });
    } catch (error) {
        console.error('Error fetching POAP token from GraphQL:', error);
        throw error;
    }
}

export async function getPoapActivity(context: AppLoadContext, eventId: number, offset: number, limit: number): Promise<{
    limit: number;
    offset: number;
    total: number;
    transferCount: number;
    tokens: POAPActivity[];
}> {
    console.log(`🌐 Fetching POAP activity from GraphQL: eventId=${eventId}, offset=${offset}, limit=${limit}`);
    
    try {
        const result = await getCollectorsByDropId({
            context,
            dropId: eventId,
            limit,
            offset
        });
        
        return {
            limit,
            offset,
            total: result.total,
            transferCount: 0, // Not available in GraphQL response
            tokens: result.collectors,
        };
    } catch (error) {
        console.error('Error fetching POAP activity from GraphQL:', error);
        throw error;
    }
}