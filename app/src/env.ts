import { AppLoadContext } from "@remix-run/cloudflare";

interface Env {
    pylonBaseUrl: string;
    poapinReadApiKey: string;
    poapApiKey: string;
    gaTrackingId: string;
    poapGraphQLBaseUrl: string;
}

interface EnvProps {
    context: AppLoadContext;
}

export const getEnv = ({ context }: EnvProps): Env => {
    const { cloudflare } = context;
    const env = cloudflare.env as Record<string, string>;

    return {
        pylonBaseUrl: env.SECRET_PYLON_BASE_URL,
        poapinReadApiKey: env.SECRET_POAPIN_READ_API,
        poapApiKey: env.SECRET_POAP_API_KEY,
        gaTrackingId: env.GA_TRACKING_ID,
        poapGraphQLBaseUrl: env.SECRET_POAP_GRAPHQL_BASE_URL,
    };
};
