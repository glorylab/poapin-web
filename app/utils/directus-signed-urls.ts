/**
 * Generate a secure asset URL using internal proxy
 * This completely hides the API key and provides server-side validation
 */
export function generateProxyAssetUrl(assetId: string): string {
  return `/api/assets/${assetId}`;
}






