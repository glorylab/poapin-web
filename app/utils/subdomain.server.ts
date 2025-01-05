// app/utils/subdomain.server.ts
export function getSubdomain(request: Request) {
    const host = request.headers.get("host") || "";
    const url = new URL(request.url);
    
    // For local development, check for subdomain in searchParams
    if (host.includes('localhost')) {
        const testSubdomain = url.searchParams.get('subdomain');
        return testSubdomain;
    }
    
    const subdomain = host.split('.')[0];
    return subdomain !== 'www' && subdomain !== 'poap' ? subdomain : null;
}