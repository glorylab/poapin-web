import { AppLoadContext } from "@remix-run/cloudflare";

interface Env {
    pylonBaseUrl: string;
    poapinReadApiKey: string;
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
    };
};
