import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { getMomentsCountFromGraphQL } from "~/utils/moments";
import { getPoapsOfAddress } from "~/lib/poap";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { address } = params;
  
  if (!address) {
    throw new Response("Address not found", { status: 404 });
  }

  // First get POAPs to resolve the actual ETH address (in case address is ENS)
  let ethAddress = address;
  try {
    const poaps = await getPoapsOfAddress(context, address);
    if (poaps && poaps.length > 0) {
      ethAddress = poaps[0].owner; // Get actual ETH address from POAP owner
      console.log(`🔍 Resolved ${address} to ETH address: ${ethAddress}`);
    }
  } catch (error) {
    console.error('Failed to resolve address or get POAPs:', error);
    // If we can't get POAPs, just redirect without auto-activation
    return redirect(`/v/${address}`);
  }

  // Get moments count to determine if we should auto-activate time capsule
  let totalMomentsCount = 0;
  try {
    totalMomentsCount = await getMomentsCountFromGraphQL(ethAddress, context);
    console.log(`🔍 Time capsule redirect for ${address} (${ethAddress}): moments count = ${totalMomentsCount}`);
  } catch (error) {
    console.error('Failed to fetch moments count for time capsule redirect:', error);
  }

  // Redirect to the main address page with a query parameter to indicate auto-activation
  const redirectUrl = totalMomentsCount > 0 
    ? `/v/${address}?auto_time_capsule=true`
    : `/v/${address}`;
    
  console.log(`🔄 Redirecting to: ${redirectUrl}`);
  return redirect(redirectUrl);
}
