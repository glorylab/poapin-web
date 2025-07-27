import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { getMomentsCountFromGraphQL } from "~/utils/moments";
import { resolveAddress } from "~/utils/ens-resolver";

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
