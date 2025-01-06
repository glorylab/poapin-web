// app/utils/subdomain.server.ts
import { MAIN_DOMAIN } from './domain';

export function getSubdomain(request: Request) {
    const host = request.headers.get("host") || "";
    // Skip subdomain check for localhost and main domain
    if (host.includes('localhost') || host === MAIN_DOMAIN) {
        return null;
    }
    const subdomain = host.split('.')[0];
    return subdomain !== 'www' && subdomain !== 'poap' ? subdomain : null;
}