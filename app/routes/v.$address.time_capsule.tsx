import { LoaderFunctionArgs, redirect, MetaFunction } from "@remix-run/cloudflare";
import { getMomentsCountFromGraphQL } from "~/utils/moments";
import { resolveAddress } from "~/utils/ens-resolver";

// Share the same meta data as the parent route for SEO purposes
export const meta: MetaFunction = ({ params, matches }) => {
  const parentMatch = matches.find(match => match.id === "routes/v.$address");
  const parentData = parentMatch?.data as any;
  const address = params.address;

  // If no parent data, return basic meta
  if (!parentData || !parentData.meta) {
    const basicTitle = `${address} - Time Capsule | POAPin`;
    const basicDescription = `Explore ${address}'s POAP moments in Time Capsule mode. Discover Web3 journey through POAPs and moments.`;
    
    return [
      { title: basicTitle },
      { name: "title", content: basicTitle },
      { name: "description", content: basicDescription },
      { name: "keywords", content: `${address}, POAP, time capsule, moments, NFT, Web3, proof of attendance` },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      
      // Open Graph
      { property: "og:title", content: basicTitle },
      { property: "og:description", content: basicDescription },
      { property: "og:image", content: `https://og.poap.in/api/poap/v/${address}` },
      { property: "og:url", content: `https://poap.in/v/${address}/time_capsule` },
      { property: "og:type", content: "profile" },
      { property: "og:site_name", content: "POAPin" },
      
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: basicTitle },
      { name: "twitter:description", content: basicDescription },
      { name: "twitter:image", content: `https://og.poap.in/api/poap/v/${address}` },
      
      // Canonical
      { tagName: "link", rel: "canonical", href: `https://poap.in/v/${address}/time_capsule` }
    ];
  }

  // Use parent meta data but customize for Time Capsule
  const { title, description, keywords, ogimageurl } = parentData.meta;
  const poapCount = parentData?.poaps?.length || 0;
  
  // Customize title and description for Time Capsule mode
  const timeCapsuleTitle = `${address} - Time Capsule | POAPin`;
  const timeCapsuleDescription = `Explore ${address}'s POAP moments in Time Capsule mode. Browse ${poapCount} POAPs and discover their Web3 journey through proof of attendance tokens.`;
  const timeCapsuleUrl = `https://poap.in/v/${address}/time_capsule`;
  const ogImage = ogimageurl || `https://og.poap.in/api/poap/v/${address}`;

  return [
    { title: timeCapsuleTitle },
    { name: "title", content: timeCapsuleTitle },
    { name: "description", content: timeCapsuleDescription },
    { name: "keywords", content: `${keywords}, time capsule, moments` },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { name: "author", content: address },
    { name: "theme-color", content: "#6366f1" },
    { name: "application-name", content: "POAPin" },

    // Open Graph - Time Capsule specific
    { property: "og:locale", content: "en_US" },
    { property: "og:title", content: timeCapsuleTitle },
    { property: "og:description", content: timeCapsuleDescription },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${address}'s POAP collection in Time Capsule mode` },
    { property: "og:url", content: timeCapsuleUrl },
    { property: "og:type", content: "profile" },
    { property: "og:site_name", content: "POAPin" },

    // Twitter Card - Time Capsule specific
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@poapin" },
    { name: "twitter:creator", content: "@poapin" },
    { name: "twitter:title", content: timeCapsuleTitle },
    { name: "twitter:description", content: timeCapsuleDescription },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: `${address}'s POAP collection in Time Capsule mode` },

    // Canonical URL
    { tagName: "link", rel: "canonical", href: timeCapsuleUrl },
    
    // Alternate URL (main collection page)
    { tagName: "link", rel: "alternate", href: `https://poap.in/v/${address}`, title: "Main Collection View" }
  ];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { address } = params;
  
  if (!address) {
    throw new Response("Address not found", { status: 404 });
  }

  const ethAddress = await resolveAddress(address, context);
  
  if (!ethAddress) {
    console.error(`Failed to resolve address: ${address}`);
    // If we can't resolve the address, redirect without auto-activation
    return redirect(`/v/${address}`);
  }
  
  // Get moments count to determine if we should auto-activate time capsule
  let totalMomentsCount = 0;
  try {
    totalMomentsCount = await getMomentsCountFromGraphQL(ethAddress, context);
  } catch (error) {
    console.error('Failed to fetch moments count for time capsule redirect:', error);
  }

  // Redirect to the main address page with a query parameter to indicate auto-activation
  const redirectUrl = totalMomentsCount > 0 
    ? `/v/${address}?auto_time_capsule=true`
    : `/v/${address}`;
    
  return redirect(redirectUrl);
}
