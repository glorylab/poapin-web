import { Grant } from "./grant";
import { POAP } from "./poap";

export type GrantData = {
    data: Grant[];
    error: string;
};

export type POAPData = {
    data: POAP[];
    error: string;
};
