export interface POAPEvent {
    id: number;
    fancy_id: string;
    name: string;
    event_url: string;
    image_url: string;
    country: string;
    city: string;
    description: string;
    year: number;
    start_date: string;
    end_date: string;
    expiry_date: string;
    supply: number;
}

export interface POAP {
    event: POAPEvent;
    tokenId: string;
    owner: string;
    chain: string;
    created: string;
}

export interface POAPDetail {
    event: POAPEvent;
    tokenId: string;
    owner: string;
    layer: string;
    created: string;
    supply: {
        total: number;
        order: number;
    };
}

export interface POAPActivity {
    created: string;
    id: string;
    owner: {
        id: string;
        tokensOwned: number;
        ens: string;
    };
    transferCount: string;
}

export interface Media {
    mime_type: string;
    gateways: {
        type: string;
        url: string;
        moment_media_id: string;
        id: string;
    }[];
    created_at: string;
}

export interface Moment {
    id: string;
    author: string;
    description: string | null;
    created_on: string;
    drop_id: number;
    medias: Media[];
}