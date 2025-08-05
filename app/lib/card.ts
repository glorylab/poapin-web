import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

export interface CardHighlight {
    id: string;
    address: string;
    description: string | null;
    status: string;
    theme: string;
}

export interface Card {
    id: number;
    status: string;
    user_created: string;
    date_created: string;
    user_updated: string;
    date_updated: string;
    intro_title: string;
    intro_description: string;
    highlights: string[];  // Directus field name
}

export interface CardWithHighlights {
    card: Card;
    highlights: CardHighlight[];
}

interface Schema {
    card: Card[];
    card_highlight: CardHighlight[];
}

export async function getCardData(context: AppLoadContext): Promise<CardWithHighlights> {

    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }

    try {
        const client = createDirectus<Schema>(directusUrl)
            .with(staticToken(apiKey))
            .with(rest());

        const cardResponse = await client.request(
            readItems('card', {
                filter: {
                    status: {
                        _eq: 'published'
                    }
                },
                fields: ['*'],
                limit: 1
            })
        );

        // Handle the response structure properly
        let cards: Card[];
        if (Array.isArray(cardResponse)) {
            // If it's already an array, use it directly
            cards = cardResponse as Card[];
        } else if (cardResponse && typeof cardResponse === 'object' && 'data' in cardResponse) {
            // Handle nested data structure {"data": ...}
            cards = Array.isArray((cardResponse as any).data) ? (cardResponse as any).data : [(cardResponse as any).data];
        } else if (cardResponse && typeof cardResponse === 'object') {
            // Single card object returned directly (this is our case)
            cards = [cardResponse as Card];
        } else {
            cards = [];
        }

        if (!cards || cards.length === 0) {
            throw new Error("No published card found");
        }

        const card = cards[0];

        const highlights = await client.request(
            readItems('card_highlight', {
                filter: {
                    status: {
                        _eq: 'published'
                    },
                    id: {
                        _in: card.highlights
                    }
                },
                fields: ['*']
            })
        ) as CardHighlight[];

        // Sort highlights by the order they appear in card.highlights array
        const sortedHighlights = card.highlights
            .map((highlightId: string) => highlights?.find(h => h.id === highlightId))
            .filter(Boolean) as CardHighlight[];

        return {
            card,
            highlights: sortedHighlights
        };

    } catch (error) {
        console.error('❌ Error fetching card data:', error);
        throw error;
    }
}

// Helper function to generate card image URL based on address and theme
export function generateCardImageUrl(address: string, theme: string): string {
    const baseUrl = "https://og.poap.in/api/poap/v";

    switch (theme) {
        case 'letter':
            return `${baseUrl}/${address}/letter`;
        case 'gallery':
            return `${baseUrl}/${address}/gallery`;
        case 'gitpoap':
            return `${baseUrl}/${address}/gitpoap`;
        case 'default':
        default:
            return `${baseUrl}/${address}/default`;
    }
}

// Helper function to generate default descriptions for highlights without descriptions
export function getDefaultDescription(address: string, theme: string): string {
    const descriptions = {
        letter: `Transform your collection into a personalized letter format perfect for sharing your achievements with ${address}.`,
        gallery: `Display your POAPs in an elegant gallery format that tells the story of your Web3 journey with ${address}.`,
        default: `Generate a beautiful card to showcase your POAP collection with ${address}. Anytime, Anywhere.`,
        gitpoap: `Generate a beautiful card to showcase your GitPOAP collection with ${address}. Anytime, Anywhere.`
    };

    return descriptions[theme as keyof typeof descriptions] || descriptions.default;
}
