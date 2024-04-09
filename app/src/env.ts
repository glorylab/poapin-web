import { AppLoadContext } from "@remix-run/cloudflare";

interface Env {
    pylonBaseUrl: string;
    poapinReadApiKey: string;
    poapApiKey: string;
    gaTrackingId: string;
    farcasterConfig: {
        url: string;
        domain: string;
        siweUri: string;
    };
}

interface EnvProps {
    context: AppLoadContext;
}

export const getEnv = ({ context }: EnvProps): Env => {
    const { cloudflare } = context;
    const env = cloudflare.env;

    return {
        pylonBaseUrl: env.SECRET_PYLON_BASE_URL,
        poapinReadApiKey: env.SECRET_POAPIN_READ_API,
        poapApiKey: env.SECRET_POAP_API_KEY,
        gaTrackingId: env.GA_TRACKING_ID,
        farcasterConfig: {
            url: env.FARCASTER_RPC_URL,
            domain: env.FARCASTER_DOMAIN,
            siweUri: env.FARCASTER_SIWE_URI,
        },
    };
};
