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
  
    return next();
  }