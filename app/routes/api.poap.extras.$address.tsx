import { json, ActionFunction, LoaderFunction } from "@remix-run/cloudflare";
import { getLastMomentsByAuthor, getMomentsCountByAuthor } from "~/lib/poap-graph";
import { getPoapsOfAddress } from "~/lib/poap";
import { getEnv } from "~/src/env";
import { getCollectionSizeDescription } from "~/utils/poap-utils";
import { POAP, Moment } from "~/types/poap";

interface PoapExtrasData {
    aiSummary: string;
    aiGenerationTime: string | null;
    latestMoments: any[];
}

// Handle GET requests (for route registration)
export const loader: LoaderFunction = async ({ params }) => {
    return json({ error: "This endpoint only supports POST requests" }, { status: 405 });
};

// Handle POST requests
export const action: ActionFunction = async ({ context, params, request }) => {
    const address = params.address;

    if (!address) {
        return json({ error: "Address not found" }, { status: 404 });
    }

    try {
        // Fetch POAPs directly by address
        const poaps: POAP[] = await getPoapsOfAddress(context, address);
        
        if (!poaps || !poaps.length) {
            return json({ error: "No POAPs found" }, { status: 404 });
        }
        
        const ethAddress = poaps[0].owner;

        let latestMoments: Moment[] = [];
        let dropsWithMoments: number[] = [];

        // Get moments count and latest moments
        const momentsCount = await getMomentsCountByAuthor({ context, author: ethAddress });
        dropsWithMoments = momentsCount.uniqueDropIds;
        
        if (momentsCount && momentsCount.totalMoments && momentsCount.totalMoments > 0) {
            latestMoments = await getLastMomentsByAuthor({ context, author: ethAddress, limit: 10 });
        }

        // Generate AI summary
        let aiGeneratedSummary = "";
        let cachedTimestamp: string | null = null;

        try {
            if (context.cloudflare && context.cloudflare.env) {
                const env = context.cloudflare.env as Record<string, any>;
                let cachedSummary = null;

                // Check KV cache first
                const kvBinding = env.POAP_SUMMARIES_KV || env["POAP_SUMMARIES_KV"];
                
                if (kvBinding) {
                    try {
                        const cachedData = await kvBinding.get(address, "json");
                        if (cachedData && typeof cachedData === 'object' && 'summary' in cachedData) {
                            cachedSummary = cachedData.summary as string;
                            cachedTimestamp = cachedData.timestamp as string;
                        }
                    } catch (error) {
                        console.error("Error getting cached summary:", error);
                    }

                    // Try ETH address if ENS didn't work
                    if (!cachedSummary && address !== ethAddress) {
                        try {
                            const cachedData = await kvBinding.get(ethAddress, "json");
                            if (cachedData && typeof cachedData === 'object' && 'summary' in cachedData) {
                                cachedSummary = cachedData.summary as string;
                                cachedTimestamp = cachedData.timestamp as string;
                            }
                        } catch (error) {
                            console.error("Error getting cached summary for ETH address:", error);
                        }
                    }

                    if (cachedSummary) {
                        aiGeneratedSummary = cachedSummary;
                    }
                }

                // Generate new AI summary if not cached
                if (!cachedSummary && env.AI) {
                    try {
                        const allPoapEvents = poaps.map((p: POAP) => p.event.name);
                        const sortedPoapEvents = allPoapEvents.sort((a: string, b: string) => {
                            const eventA = poaps.find((p: POAP) => p.event.name === a);
                            const eventB = poaps.find((p: POAP) => p.event.name === b);
                            return (eventB?.event.supply || 0) - (eventA?.event.supply || 0);
                        });

                        // Token estimation and event filtering
                        const maxTokensForEvents = 7000;
                        let totalEventTokens = 0;
                        let includedEvents = [];

                        for (const eventName of sortedPoapEvents) {
                            const estimatedTokens = eventName.split(/\s+/).length * 1.5 + 2;
                            if (totalEventTokens + estimatedTokens <= maxTokensForEvents) {
                                includedEvents.push(eventName);
                                totalEventTokens += estimatedTokens;
                            } else {
                                break;
                            }
                        }

                        const poapEvents = includedEvents.join(", ");
                        const prompt = `
                            You are an expert in analyzing NFT collections. I'm going to show you a POAP (Proof of Attendance Protocol) collection, and I need you to write a concise, personalized 1-2 sentence summary that describes the unique characteristics of this collection.
                            
                            POAP Collection for ${address}:
                            - Collection Size: ${getCollectionSizeDescription(poaps.length)}
                            - Event Names: ${poapEvents}
                            
                            Instructions:
                            1. Analyze the event names to identify unique patterns, themes, or interests
                            2. Write a concise, personalized 1-2 sentence summary that describes what makes this POAP collection unique
                            3. Focus on the specific events, locations, or themes that are distinctive to this collection
                            4. DO NOT start with phrases like "This collection is" or "This wallet demonstrates"
                            5. DO NOT include any prefixes like "Here is a summary:" - just provide the summary directly
                            6. DO NOT explain what POAPs are generally
                            7. DO NOT compare this collection to other collections (avoid phrases like "sets it apart from other collections")
                            8. Start directly with the unique aspects of the collection
                            9. Be specific about the events and themes you identify
                            10. Keep the focus entirely on this collection's characteristics without reference to others
                            11. DO NOT mention the exact number of POAPs in the collection
                        `;

                        let result;
                        if (typeof env.AI === 'object' && env.AI !== null) {
                            if (typeof env.AI.run === 'function') {
                                result = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
                                    prompt: prompt,
                                });
                            }
                        }

                        if (result && typeof result === 'object' && 'response' in result) {
                            let response = result.response;
                            
                            // Clean up the response
                            const prefixesToRemove = [
                                "Here is a concise, personalized 1-2 sentence summary:",
                                "Here's a concise, personalized summary:",
                                "Here is my summary:",
                                "Summary:"
                            ];

                            for (const prefix of prefixesToRemove) {
                                if (response.includes(prefix)) {
                                    response = response.replace(prefix, "").trim();
                                }
                            }

                            response = response.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
                            response = response.replace(/^"|"$/g, "");
                            aiGeneratedSummary = response;

                            // Cache the result
                            if (kvBinding && aiGeneratedSummary) {
                                try {
                                    const oneMonthInSeconds = 30 * 24 * 60 * 60;
                                    const dataToStore = {
                                        summary: aiGeneratedSummary,
                                        timestamp: new Date().toISOString()
                                    };

                                    await kvBinding.put(address, JSON.stringify(dataToStore), { expirationTtl: oneMonthInSeconds });
                                    if (address !== ethAddress) {
                                        await kvBinding.put(ethAddress, JSON.stringify(dataToStore), { expirationTtl: oneMonthInSeconds });
                                    }
                                } catch (error) {
                                    console.error("Error storing summary in KV:", error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error generating AI summary:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in AI summary generation:', error);
        }

        const aiGenerationTimestamp = cachedTimestamp || (aiGeneratedSummary ? new Date().toISOString() : null);

        const result: PoapExtrasData = {
            aiSummary: aiGeneratedSummary,
            aiGenerationTime: aiGenerationTimestamp,
            latestMoments
        };

        return json(result);
    } catch (error) {
        console.error('Error in poap-extras loader:', error);
        return json({ error: "Failed to load extra data" }, { status: 500 });
    }
};
