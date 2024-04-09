import { AppLoadContext } from '@remix-run/cloudflare';
import { getEnv } from '~/src/env';
import { Moment } from '~/types/poap';

interface GetLastMomentsByAuthorResponse {
    moments: Moment[];
}

interface GraphQLResponse<T> {
    data: T;
}

interface FetchGetLastMomentsByAuthorProps {
    context: AppLoadContext;
    author: string;
}

export async function getLastMomentsByAuthor({
    context,
    author,
}: FetchGetLastMomentsByAuthorProps): Promise<Moment[]> {
    const poapGraphQLBaseUrl  = getEnv({ context }).poapGraphQLBaseUrl;

    console.log('poapGraphQLBaseUrl:', poapGraphQLBaseUrl);

    const query = `
      query GetLastMomentsByAuthor {
        moments(
          limit: 100
          where: { author: { _eq: "${author}" } }
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

        // const { data } = await response.json();
        const { data } = await response.json() as GraphQLResponse<GetLastMomentsByAuthorResponse>;

        return data.moments;
    } catch (error) {
        console.error('Failed to retrieve data:', error);
        throw error;
    }
}