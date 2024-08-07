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

export interface Collection {
    id: number;
    title: string;
    description: string;
    slug: string;
    logo_image_url: string;
    banner_image_url: string;
    created_by: string;
    created_on: string;
    updated_on: string;
    owner_address: string;
    collections_items: {
        drop_id: number;
    }[];
    collections_items_aggregate: {
        aggregate: {
            count: number;
        };
    };
}

export interface GetCollectionsByDropIdsResponse {
    collections: Collection[];
}

export interface FetchGetCollectionsByDropIdsProps {
    context: AppLoadContext;
    dropIds: number[];
    limit?: number;
    offset?: number;
}

export async function getLastMomentsByAuthor({
    context,
    author,
    limit = 100,
}: FetchGetLastMomentsByAuthorProps): Promise<Moment[]> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    console.log('poapGraphQLBaseUrl:', poapGraphQLBaseUrl);
    console.log('author:', author);

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
          drop {
            image_url
          }
          media {
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
            console.error(`HTTP error! status: ${response.status}`);
            return [];
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

export async function getCollectionsByDropIds({
    context,
    dropIds,
    limit = 12,
    offset = 0,
}: FetchGetCollectionsByDropIdsProps): Promise<Collection[]> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    const query = `
      query FilteredCollections($limit: Int!, $offset: Int!, $dropIds: [bigint!]) {
        collections(
          limit: $limit, 
          offset: $offset, 
          order_by: {id: desc}, 
          where: {
            collections_items: {
              drop_id: {_in: $dropIds}
            }
          }
        ) {
          id
          title
          description
          slug
          logo_image_url
          banner_image_url
          created_by
          created_on
          updated_on
          owner_address
          collections_items(where: {drop_id: {_in: $dropIds}}) {
            drop_id
          }
          collections_items_aggregate {
            aggregate {
                count
            }
          }
        }
      }
    `;

    console.log('poapGraphQLBaseUrl:', poapGraphQLBaseUrl);
    console.log('dropIds:', dropIds);
    console.log('limit:', limit);
    console.log('offset:', offset);
    console.log('query:', query);

    try {
        const response = await fetch(poapGraphQLBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    limit,
                    offset,
                    dropIds: dropIds.map(String), // Convert numbers to strings for bigint
                },
            }),
        });

        console.log('response:', response);
        console.log('response.ok:', response.ok);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json() as GraphQLResponse<GetCollectionsByDropIdsResponse>;
        console.log('data:', data);
        return data.collections;
    } catch (error) {
        console.error('Failed to retrieve collections:', error);
        throw error;
    }
}
