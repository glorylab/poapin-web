import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";

interface MomentsCountResponse {
  moments_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

const GET_MOMENTS_COUNT_QUERY = `
  query GetMomentsCount($author: bpchar!) {
    moments_aggregate(
      where: {author: {_eq: $author}}
    ) {
      aggregate {
        count
      }
    }
  }
`;

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { address } = params;

  if (!address) {
    return json({ error: "Address parameter is required" }, { status: 400 });
  }

  try {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;
    
    // Parse the address to lowercase
    const normalizedAddress = address.toLowerCase();

    const requestBody = {
      query: GET_MOMENTS_COUNT_QUERY,
      variables: {
        author: normalizedAddress,
      },
    };
    
    const countResponse = await fetch(poapGraphQLBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!countResponse.ok) {
      const errorText = await countResponse.text();
      console.error('❌ Count query failed:', countResponse.status, countResponse.statusText);
      console.error('❌ Error response body:', errorText);
      throw new Error(`Count query failed: ${countResponse.status} - ${errorText}`);
    }

    const countData = await countResponse.json() as { data: MomentsCountResponse };
    const totalCount = countData.data?.moments_aggregate?.aggregate?.count || 0;

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
