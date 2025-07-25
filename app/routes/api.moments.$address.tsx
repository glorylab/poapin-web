import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getEnv } from "~/src/env";

interface MomentMedia {
  gateways: {
    url: string;
    type: string;
  }[];
  status: string;
}

interface MomentLink {
  url: string;
  title: string;
}

interface MomentUserTag {
  ens: string | null;
  address: string;
}

interface Moment {
  drop_id: number;
  id: string;
  display_id: string;
  description: string | null;
  created_on: string;
  media: MomentMedia[];
  links: MomentLink[];
  user_tags: MomentUserTag[];
}

interface MomentsResponse {
  moments_aggregate: {
    aggregate: {
      count: number;
    };
    nodes: Moment[];
  };
}

const GET_ALL_MOMENTS_QUERY = `
  query GetAllMomentsByAuthor($author: bpchar!, $limit: Int!, $offset: Int!) {
    moments(
      where: {author: {_eq: $author}}
      order_by: {created_on: desc}
      limit: $limit
      offset: $offset
    ) {
      id
      author
      created_on
      description
      drops {
        drop {
          id
          image_url
          name
          description
        }
      }
      media(limit: 3, order_by: { created_at: asc }) {
        mime_type
        gateways {
          metadata
          url
          type
        }
      }
      media_aggregate {
        aggregate {
          count
        }
      }
      user_tags_aggregate {
        aggregate {
          count
        }
      }
      links {
        description
        image_url
        title
        url
      }
    }
  }
`;

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
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = (page - 1) * limit;

  if (!address) {
    return json({ error: "Address parameter is required" }, { status: 400 });
  }

  try {
    console.log('🔍 Fetching moments for address:', address, 'page:', page, 'limit:', limit);
    console.log('⚙️ Using address directly (no resolution needed, frontend passes owner address)');
    
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    // First, get the total count
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

    const countData = await countResponse.json() as any;
    const totalCount = countData.data?.moments_aggregate?.aggregate?.count || 0;
    
    // Then get the actual moments
    const response = await fetch(poapGraphQLBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_MOMENTS_QUERY,
        variables: {
          author: address,
          limit,
          offset,
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ GraphQL request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json() as any;
    console.log('📦 GraphQL Response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const moments = data.data?.moments || [];
    
    console.log('📊 Moments stats:', {
      totalCount,
      currentPage: page,
      momentsInPage: moments.length,
      offset
    });

    const hasMore = offset + limit < totalCount;

    return json({
      moments,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching moments:', error);
    return json(
      { 
        error: "Failed to fetch moments",
        moments: [], 
        totalCount: 0, 
        page, 
        limit, 
        hasMore: false 
      }, 
      { status: 500 }
    );
  }
}
