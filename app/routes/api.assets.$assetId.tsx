import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { assetId } = params;

  if (!assetId) {
    return new Response("Asset ID is required", { status: 400 });
  }

  try {
    const directusUrl = getEnv({ context }).pylonBaseUrl;
    const apiKey = getEnv({ context }).poapinReadApiKey;
    
    console.log(`🔒 Secure asset request for: ${assetId}`);
    
    if (!apiKey) {
      console.error('❌ No API key found');
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch the asset from Directus with authentication
    const assetUrl = `${directusUrl}/assets/${assetId}?access_token=${apiKey}`;
    
    const response = await fetch(assetUrl);
    
    console.log(`- Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch asset ${assetId}:`, response.status, errorText);
      return new Response(`Asset fetch failed: ${response.status}`, { status: response.status });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Create a new response with the asset data
    const assetData = await response.arrayBuffer();
    
    console.log(`✅ Asset served successfully: ${assetId}`);
    
    return new Response(assetData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Error proxying asset:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
