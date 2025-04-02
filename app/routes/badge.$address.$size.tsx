import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * Proxy route for POAP badges
 * This route proxies requests to the POAP badge API and returns the badge SVG
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { address, size } = params;
  
  // Validate size parameter
  if (!['sm', 'md', 'lg'].includes(size as string)) {
    return new Response('Invalid size parameter. Must be one of: sm, md, lg', {
      status: 400,
    });
  }

  try {
    // Fetch the badge from the original API
    const response = await fetch(`https://og.poap.in/api/poap/badge/${address}/${size}`);
    
    // Get the SVG content
    const svgContent = await response.text();
    
    // Return the SVG with appropriate headers
    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching badge:', error);
    return new Response('Error fetching badge', {
      status: 500,
    });
  }
}
