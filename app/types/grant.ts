
interface Amount {
    id: string;
    number: string;
    quantity: number;
}

interface Round {
    id: string;
    title: string;
    description: string;
    donor_counts: number;
    amount: {
        amount_id: Amount;
    }[];
}

interface ImageAsset {
    id: string;
    filename_disk: string;
    type: string;
    title: string;
    filesize: string;
    width: number;
    height: number;
    url?: string;
}

export interface Grant {
    id: string;
    status: 'draft' | 'published' | 'archived';
    title: string;
    description: string;
    image: ImageAsset;
    start_time: string;
    end_time: string;
    rounds: {
        grant_rounds_id: Round;
    }[];
}

export interface GrantsResponse {
    data: Grant[];
    error?: string;
}



