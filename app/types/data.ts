import { Grant } from "./grant";
import { POAP, POAPDetail } from "./poap";

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