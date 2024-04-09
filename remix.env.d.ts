/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

import type { AppLoadContext as OriginalAppLoadContext } from "@remix-run/server-runtime";

declare module "@remix-run/server-runtime" {
    export interface AppLoadContext extends OriginalAppLoadContext {
        cloudflare: {
            env: {
                SECRET_PYLON_BASE_URL: string;
                SECRET_POAPIN_READ_API: string;
                SECRET_POAP_API_KEY: string;
                GA_TRACKING_ID: string;
                SECRET_POAP_GRAPHQL_BASE_URL: string;
            };
        };
    }
}