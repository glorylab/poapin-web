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

    const query = `
      query GetLastMomentsByAuthor {
        moments(
          limit: ${limit},
          where: { 
                author: { _eq: "${author}" },
                drop_id: { _is_null: false } 
          },
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

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return [];
        }

        const { data } = result as GraphQLResponse<GetLastMomentsByAuthorResponse>;
        return data?.moments || [];
    } catch (error) {
        console.error('Failed to retrieve data:', error);
        return [];
    }
}

export async function getMomentsCountByAuthor({
    context,
    author,
}: FetchGetMomentsCountByAuthorProps): Promise<MomentsCountResult> {
    try {
        const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;
        const pageSize = 200;
        let allDropIds: number[] = [];
        let totalMoments = 0;
        let offset = 0;
        let hasMore = true;

        // First request to get total count and first batch
        const firstQuery = `
            query GetMomentsCountByAuthor {
                moments_aggregate(
                    where: { author: { _eq: "${author}" } }
                    distinct_on: drop_id
                    limit: ${pageSize}
                    offset: ${offset}
                ) {
                    aggregate {
                        count
                    }
                    nodes {
                        drop_id
                    }
                }
            }
        `;

        const firstResponse = await fetch(poapGraphQLBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: firstQuery }),
        });

        if (!firstResponse.ok) {
            throw new Error(`HTTP error! status: ${firstResponse.status}`);
        }

        const { data: firstData } = await firstResponse.json() as GraphQLResponse<GetMomentsCountByAuthorResponse>;
        totalMoments = firstData.moments_aggregate.aggregate.count;
        
        // Process first batch and filter out invalid data
        const firstBatchDropIds = firstData.moments_aggregate.nodes
            .map((node) => node.drop_id)
            .filter((id): id is number => typeof id === 'number' && !isNaN(id));
        
        allDropIds.push(...firstBatchDropIds);
        offset += pageSize;

        console.log("First batch - Total moments:", totalMoments);
        console.log("First batch - Drop IDs:", firstBatchDropIds.length);

        // Continue fetching if there are more pages
        while (offset < totalMoments && hasMore) {
            const pageQuery = `
                query GetMomentsCountByAuthorPage {
                    moments_aggregate(
                        where: { author: { _eq: "${author}" } }
                        distinct_on: drop_id
                        limit: ${pageSize}
                        offset: ${offset}
                    ) {
                        nodes {
                            drop_id
                        }
                    }
                }
            `;

            const pageResponse = await fetch(poapGraphQLBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: pageQuery }),
            });

            if (!pageResponse.ok) {
                console.warn(`Failed to fetch page at offset ${offset}:`, pageResponse.status);
                break;
            }

            const { data: pageData } = await pageResponse.json() as GraphQLResponse<GetMomentsCountByAuthorResponse>;
            const pageDropIds = pageData.moments_aggregate.nodes
                .map((node) => node.drop_id)
                .filter((id): id is number => typeof id === 'number' && !isNaN(id));
            
            if (pageDropIds.length === 0) {
                hasMore = false;
                break;
            }

            allDropIds.push(...pageDropIds);
            offset += pageSize;

            console.log(`Page ${Math.floor(offset / pageSize)} - Drop IDs:`, pageDropIds.length);
        }

        // Remove duplicates and ensure all are valid numbers
        const uniqueDropIds = [...new Set(allDropIds)];

        console.log("Final results for author:", author);
        console.log("Total moments:", totalMoments);
        console.log("Unique drop IDs count:", uniqueDropIds.length);
        console.log("Sample drop IDs:", uniqueDropIds.slice(0, 10));
        
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

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json() as GraphQLResponse<GetCollectionsByDropIdsResponse>;

        return data.collections;
    } catch (error) {
        console.error('Failed to retrieve collections:', error);
        throw error;
    }
}
