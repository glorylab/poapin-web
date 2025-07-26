import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getMomentsCountFromGraphQL } from "~/utils/moments";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { address } = params;

  if (!address) {
    return json({ error: "Address parameter is required" }, { status: 400 });
  }

  try {
    const totalCount = await getMomentsCountFromGraphQL(address, context);

    return json({
      totalMomentsCount: totalCount,
      success: true
    });

  } catch (error) {
    console.error('❌ Error fetching moments count:', error);
    return json({ 
      error: error instanceof Error ? error.message : "Failed to fetch moments count",
      totalMomentsCount: 0,
      success: false
    }, { status: 500 });
  }
}
