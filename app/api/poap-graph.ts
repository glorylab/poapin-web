import { AppLoadContext } from '@remix-run/cloudflare';
import { getEnv } from '~/src/env';
import { Moment } from '~/types/poap';

interface GetLastMomentsByAuthorResponse {
    moments: Moment[];
}

interface GetMomentsCountByAuthorResponse {
    moments_aggregate: {
        aggregate: {
            count: number;
        };
        nodes: {
            drop_id: number;
        }[];
    };
}

interface GraphQLResponse<T> {
    data: T;
}

interface FetchGetLastMomentsByAuthorProps {
    context: AppLoadContext;
    author: string;
    limit?: number;
}

interface FetchGetMomentsCountByAuthorProps {
    context: AppLoadContext;
    author: string;
}

interface MomentsCountResult {
    totalMoments: number;
    uniqueDropIds: number[];
}
export async function getLastMomentsByAuthor({
    context,
    author,
    limit = 100,
}: FetchGetLastMomentsByAuthorProps): Promise<Moment[]> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    console.log('poapGraphQLBaseUrl:', poapGraphQLBaseUrl);

    const query = `
      query GetLastMomentsByAuthor {
        moments(
          limit: ${limit},
          where: { author: { _eq: "${author}" } },
          order_by: { created_on: desc }
        ) {
          id
          author
          description
          created_on
          drop_id
          medias {
            mime_type
            gateways {
              type
              url
              moment_media_id
              id
            }
            created_at
          }
        }
      }
    `;

    try {
        const response = await fetch(poapGraphQLBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json() as GraphQLResponse<GetLastMomentsByAuthorResponse>;

        return data.moments;
    } catch (error) {
        console.error('Failed to retrieve data:', error);
        throw error;
    }
}

export async function getMomentsCountByAuthor({
    context,
    author,
}: FetchGetMomentsCountByAuthorProps): Promise<MomentsCountResult> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    const query = `
        query GetMomentsCountByAuthor {
            moments_aggregate(where: { author: { _eq: "${author}" } }) {
                aggregate {
                count
                }
                nodes {
                drop_id
                }
            }
        }
    `;

    try {
        const response = await fetch(poapGraphQLBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json() as GraphQLResponse<GetMomentsCountByAuthorResponse>;
        const totalMoments = data.moments_aggregate.aggregate.count;
        const uniqueDropIds = [...new Set(data.moments_aggregate.nodes.map((node) => node.drop_id))];

        return {
            totalMoments,
            uniqueDropIds,
        };
    } catch (error) {
        console.error('Failed to retrieve data:', error);
        throw error;
    }
}