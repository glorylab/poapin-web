import { atom } from 'jotai';

export interface OGImageState {
    status: "completed" | "not_found" | "pending";
    url: string;
    retryCount: number;
}

export const createOGImageAtom = (address: string, theme: "default" | "letter") => {
    return atom<OGImageState>({
        status: "pending",
        url: `https://og.poap.in/api/poap/v/${address}/${theme}`,
        retryCount: 0
    });
};

export const ogImageAtomsMap = new Map<string, ReturnType<typeof createOGImageAtom>>();