// functions/_middleware.ts
export async function onRequest({ request, next }: any) {
    const url = new URL(request.url);
    
    // If the hostname ends with poap.in
    if (url.hostname.endsWith('poap.in')) {
      const subdomain = url.hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== '') {
        // Rewrite the path
        url.pathname = `/v/${subdomain}.eth${url.pathname}`;
        request = new Request(url, request);
      }
    }
    
    // If the request is for assets or API, proxy to the original site
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/api/')) {
      const targetUrl = `https://poap.in${url.pathname}${url.search}`;
      return fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }
  
    return next();
  }