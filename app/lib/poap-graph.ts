import { AppLoadContext } from '@remix-run/cloudflare';
import { getEnv } from '~/src/env';
import { Moment, POAP, POAPEvent, POAPDetail, POAPActivity } from '~/types/poap';

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
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: Array<string | number>;
    }>;
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

interface GetTokensByOwnerResponse {
    poaps: {
        id: number;
        chain: string;
        drop_id: number;
        minted_on: number;
        transfer_count: number;
        drop: {
            animation_url: string | null;
            country: string;
            created_date: string;
            description: string;
            drop_url: string;
            city: string;
            start_date: string;
            end_date: string;
            expiry_date: string;
            fancy_id: string;
            id: number;
            image_url: string;
            location_type: string;
            integrator_id: string | null;
            name: string;
            virtual: boolean;
            year: number;
            timezone: string | null;
        };
    }[];
}

export interface FetchGetTokensByOwnerProps {
    context: AppLoadContext;
    owner: string;
    limit?: number;
    offset?: number;
}

interface GetTokenByIdResponse {
    poaps: {
        id: number;
        chain: string;
        drop_id: number;
        minted_on: number;
        transfer_count: number;
        drop: {
            animation_url: string | null;
            country: string;
            created_date: string;
            description: string;
            drop_url: string;
            city: string;
            start_date: string;
            end_date: string;
            expiry_date: string;
            fancy_id: string;
            id: number;
            image_url: string;
            location_type: string;
            integrator_id: string | null;
            name: string;
            virtual: boolean;
            year: number;
            timezone: string | null;
        };
    }[];
}

export interface FetchGetTokenByIdProps {
    context: AppLoadContext;
    tokenId: string;
}

interface GetCollectorInfoResponse {
    collectors: {
        address: string;
        poaps_owned: number;
    }[];
}

export interface FetchGetCollectorInfoProps {
    context: AppLoadContext;
    address: string;
}

interface GetCollectorsByDropIdResponse {
    collectors: {
        address: string;
        poaps_owned: number;
    }[];
}

export interface FetchGetCollectorsByDropIdProps {
    context: AppLoadContext;
    dropId: number;
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

        const result = await response.json() as GraphQLResponse<GetLastMomentsByAuthorResponse>;

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return [];
        }

        const { data } = result;
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
        }

        // Remove duplicates and ensure all are valid numbers
        const uniqueDropIds = [...new Set(allDropIds)];
        
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

export async function getTokensByOwner({
    context,
    owner,
    limit = 1000,
    offset = 0,
}: FetchGetTokensByOwnerProps): Promise<POAP[]> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    // Parse the address to lowercase
    const ownerAddress = owner.toLowerCase();

    const query = `
      query GetTokensByOwner {
        poaps(
          where: { collector_address: { _eq: "${ownerAddress}" } }
          limit: ${limit}
          offset: ${offset}
          order_by: { minted_on: desc }
        ) {
          id
          chain
          drop_id
          minted_on
          transfer_count
          drop {
            animation_url
            country
            created_date
            description
            drop_url
            end_date
            expiry_date
            fancy_id
            id
            image_url
            location_type
            integrator_id
            name
            virtual
            year
            timezone
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as GraphQLResponse<GetTokensByOwnerResponse>;

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error('GraphQL query failed');
        }

        const { data } = result;
        
        // Transform GraphQL response to match expected POAP interface
        const poaps: POAP[] = data.poaps.map(poap => ({
            event: {
                id: poap.drop.id,
                fancy_id: poap.drop.fancy_id || '',
                name: poap.drop.name || '',
                event_url: poap.drop.drop_url || '',
                image_url: poap.drop.image_url || '',
                country: poap.drop.country || '',
                city: poap.drop.city || '',
                description: poap.drop.description || '',
                year: poap.drop.year || 0,
                start_date: poap.drop.start_date || new Date(poap.minted_on * 1000).toISOString(),
                end_date: poap.drop.end_date || new Date(poap.minted_on * 1000).toISOString(),
                expiry_date: poap.drop.expiry_date || '',
                supply: 0, // Not available in GraphQL response
            },
            tokenId: poap.id.toString(),
            owner: ownerAddress, // Use the resolved owner address
            chain: poap.chain,
            created: new Date(poap.minted_on * 1000).toISOString(), // Convert timestamp to ISO string
        }));

        return poaps;
    } catch (error) {
        console.error('Failed to retrieve tokens from GraphQL:', error);
        throw error;
    }
}

export async function getTokenById({
    context,
    tokenId,
}: FetchGetTokenByIdProps): Promise<POAPDetail> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    const query = `
      query GetTokenById {
        poaps(
          where: { id: { _eq: ${tokenId} } }
          limit: 1
        ) {
          id
          chain
          drop_id
          minted_on
          transfer_count
          drop {
            animation_url
            country
            created_date
            description
            drop_url
            city
            start_date
            end_date
            expiry_date
            fancy_id
            id
            image_url
            location_type
            integrator_id
            name
            virtual
            year
            timezone
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as GraphQLResponse<GetTokenByIdResponse>;

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error('GraphQL query failed');
        }

        const { data } = result;
        
        if (!data.poaps || data.poaps.length === 0) {
            throw new Error('Token not found');
        }

        const poap = data.poaps[0];
        
        // Transform GraphQL response to match expected POAPDetail interface
        const poapDetail: POAPDetail = {
            event: {
                id: poap.drop.id,
                fancy_id: poap.drop.fancy_id || '',
                name: poap.drop.name || '',
                event_url: poap.drop.drop_url || '',
                image_url: poap.drop.image_url || '',
                country: poap.drop.country || '',
                city: poap.drop.city || '',
                description: poap.drop.description || '',
                year: poap.drop.year || 0,
                start_date: poap.drop.start_date || new Date(poap.minted_on * 1000).toISOString(),
                end_date: poap.drop.end_date || new Date(poap.minted_on * 1000).toISOString(),
                expiry_date: poap.drop.expiry_date || '',
                supply: 0, // Not available in GraphQL response
            },
            tokenId: poap.id.toString(),
            owner: '', // We'll need to get this from a different query if needed
            layer: poap.chain,
            created: new Date(poap.minted_on * 1000).toISOString(),
            supply: {
                total: 0, // Not available in GraphQL response
                order: 0,  // Not available in GraphQL response
            },
        };

        return poapDetail;
    } catch (error) {
        console.error('Failed to retrieve token from GraphQL:', error);
        throw error;
    }
}

export async function getCollectorsByDropId({
    context,
    dropId,
    limit = 9,
    offset = 0,
}: FetchGetCollectorsByDropIdProps): Promise<{
    collectors: POAPActivity[];
    total: number;
}> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;

    // First get the total count
    const countQuery = `
      query GetCollectorsCount {
        collectors_aggregate(
          where: { poaps: { drop_id: { _eq: "${dropId}" } } }
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    // Then get the paginated results
    const dataQuery = `
      query GetCollectorsByDropId {
        collectors(
          where: { poaps: { drop_id: { _eq: "${dropId}" } } }
          limit: ${limit}
          offset: ${offset}
          order_by: { poaps_owned: desc }
        ) {
          address
          poaps_owned
        }
      }
    `;

    try {
        // Execute both queries in parallel
        const [countResponse, dataResponse] = await Promise.all([
            fetch(poapGraphQLBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: countQuery }),
            }),
            fetch(poapGraphQLBaseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: dataQuery }),
            })
        ]);

        if (!countResponse.ok || !dataResponse.ok) {
            throw new Error(`HTTP error! count: ${countResponse.status}, data: ${dataResponse.status}`);
        }

        const [countResult, dataResult] = await Promise.all([
            countResponse.json(),
            dataResponse.json()
        ]);

        if (countResult.errors || dataResult.errors) {
            console.error('GraphQL errors:', countResult.errors || dataResult.errors);
            throw new Error('GraphQL query failed');
        }

        const totalCount = countResult.data.collectors_aggregate.aggregate.count;
        const collectors: POAPActivity[] = dataResult.data.collectors.map((collector: any) => ({
            created: '', // Not available in this query
            id: `${dropId}-${collector.address}`,
            owner: {
                id: collector.address,
                tokensOwned: collector.poaps_owned,
                ens: '', // ENS resolution would need a separate query
            },
            transferCount: '0', // Not available in this query
        }));

        return {
            collectors,
            total: totalCount,
        };
    } catch (error) {
        console.error('Failed to retrieve collectors from GraphQL:', error);
        throw error;
    }
}

export async function getCollectorInfo({
    context,
    address,
}: FetchGetCollectorInfoProps): Promise<number> {
    const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;
    
    // Parse the address to lowercase
    const ownerAddress = address.toLowerCase();

    const query = `
      query GetCollectorInfo {
        collectors(
          where: { address: { _eq: "${ownerAddress}" } }
          limit: 1
        ) {
          address
          poaps_owned
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as GraphQLResponse<GetCollectorInfoResponse>;

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error('GraphQL query failed');
        }

        const { data } = result;
        
        if (!data.collectors || data.collectors.length === 0) {
            return 0; // No POAPs found for this address
        }

        return data.collectors[0].poaps_owned;
    } catch (error) {
        console.error('Failed to retrieve collector info from GraphQL:', error);
        return 0; // Return 0 on error to avoid breaking the UI
    }
}
