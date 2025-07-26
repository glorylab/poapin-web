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

export async function getMomentsCountFromGraphQL(address: string, context: any): Promise<number> {
  try {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    const countResponse = await fetch(poapGraphQLBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_MOMENTS_COUNT_QUERY,
        variables: {
          author: address,
        },
      }),
    });

    if (!countResponse.ok) {
      console.error('❌ Count query failed:', countResponse.status, countResponse.statusText);
      throw new Error(`Count query failed: ${countResponse.status}`);
    }

    const countData = await countResponse.json() as { data: MomentsCountResponse };
    const totalCount = countData.data?.moments_aggregate?.aggregate?.count || 0;

    return totalCount;
  } catch (error) {
    console.error('❌ Error fetching moments count from GraphQL:', error);
    return 0;
  }
}
