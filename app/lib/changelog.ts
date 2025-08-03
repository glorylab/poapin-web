import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import { Changelog } from "~/types/changelog";
import { processMarkdownAssets } from "~/utils/directus-assets";

interface Schema {
    changelog: Changelog[];
}

export async function getChangelogs(context: AppLoadContext) {
    console.log('🔍 Starting getChangelogs...');
    
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;
    
    console.log('- Directus URL:', directusUrl);
    console.log('- API Key exists:', !!apiKey);
    
    if (!apiKey) {
        throw new Error("API key not found");
    }

    try {
        const client = createDirectus<Schema>(directusUrl)
            .with(staticToken(apiKey))
            .with(rest());
        
        console.log('- Client created successfully');
        
        // Get all published changelogs, sorted by date_created descending
        console.log('- Fetching changelogs with readItems...');
        
        const changelogs = await client.request(
            readItems('changelog', {
                filter: {
                    status: {
                        _eq: 'published'
                    }
                },
                sort: ['-date_created'],
                fields: ['*']
            })
        ) as Changelog[];
        
        console.log('- API response:', changelogs);
        console.log('- Data count:', changelogs?.length || 0);
        
        // Process markdown content to add authentication to asset URLs
        // Note: processMarkdownAssets is synchronous and uses time-limited URLs
        const processedChangelogs = changelogs?.map(changelog => {
            try {
                return {
                    ...changelog,
                    content: processMarkdownAssets(changelog.content, context)
                };
            } catch (error) {
                console.error('Error processing markdown assets for changelog:', changelog.id, error);
                return changelog; // Return original if processing fails
            }
        }) || [];
        
        console.log('- Processed changelogs with authenticated assets');
        
        return {
            data: processedChangelogs
        };
    } catch (error) {
        console.error('❌ Error fetching changelogs:', error);
        console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error('Failed to fetch changelogs');
    }
}

export async function getChangelogById(context: AppLoadContext, id: string) {
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;
    
    if (!apiKey) {
        throw new Error("API key not found");
    }

    try {
        const client = createDirectus<Schema>(directusUrl)
            .with(staticToken(apiKey))
            .with(rest());
        
        // Get specific changelog by ID
        const changelog = await client.request(
            readItems('changelog', {
                filter: {
                    id: {
                        _eq: id
                    }
                },
                fields: ['*']
            })
        ) as Changelog[];
        
        return {
            data: changelog[0] || null
        };
    } catch (error) {
        console.error('Error fetching changelog:', error);
        throw new Error('Failed to fetch changelog');
    }
}
