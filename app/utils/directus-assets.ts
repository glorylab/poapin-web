import { AppLoadContext } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";
import { generateProxyAssetUrl } from "~/utils/directus-signed-urls";

/**
 * Transform Directus asset URLs to use secure proxy with expiration validation
 * This completely hides the API key and validates expiration server-side
 */
export function transformDirectusAssetUrl(url: string, context: AppLoadContext): string {
    if (!url) return url;
    
    // Check if this is a Directus asset URL
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    
    if (!url.startsWith(directusUrl)) {
        return url;
    }
    
    const assetMatch = url.match(/\/assets\/([a-f0-9-]+)/);
    if (!assetMatch) {
        return url; // Return original URL if we can't parse it
    }
    
    const assetId = assetMatch[1];
    
    try {
        // Generate a secure proxy URL
        return generateProxyAssetUrl(assetId);
    } catch (error) {
        console.error('Failed to generate proxy asset URL:', error);
        return url; // Return original URL as fallback
    }
}

/**
 * Process markdown content to transform all Directus asset URLs to use secure proxy
 * This completely hides the API key and provides server-side validation
 */
export function processMarkdownAssets(content: string, context: AppLoadContext): string {
    if (!content) return content;
    
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    
    // Regular expression to find image URLs in markdown
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    return content.replace(imageRegex, (match, alt, url) => {
        // Only transform Directus asset URLs
        if (url.startsWith(directusUrl)) {
            // Extract asset ID from Directus URL
            const assetMatch = url.match(/\/assets\/([a-f0-9-]+)/);
            if (assetMatch) {
                const assetId = assetMatch[1];
                try {
                    // Use secure proxy URL
                    const proxyUrl = generateProxyAssetUrl(assetId);
                    return `![${alt}](${proxyUrl})`;
                } catch (error) {
                    console.error('Failed to generate proxy URL for markdown asset:', error);
                    return match; // Return original if proxy generation fails
                }
            }
        }
        return match;
    });
}
