import { Grant } from "./grant";
import { POAP, POAPActivity, POAPDetail } from "./poap";

export type GrantData = {
    data: Grant[];
    error: string;
};

export type POAPData = {
    data: POAP[];
    error: string;
};

export type POAPDetailData = {
    data: POAPDetail;
    error: string;
};

export type POAPActivityData = {
    data: {
        limit: number;
        offset: number;
        total: number;
        transferCount: number;
        tokens: POAPActivity[];
    }
    error: string;
};