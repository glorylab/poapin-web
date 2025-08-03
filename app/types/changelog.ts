export interface Changelog {
    id: string;
    status: 'draft' | 'published' | 'archived';
    sort?: number | null;
    user_created: string;
    date_created: string;
    user_updated: string;
    date_updated: string;
    release_date: string;
    title: string;
    tags: string[];
    version: string;
    content: string;
}

export interface ChangelogResponse {
    data: Changelog[];
    error?: string;
}

export interface ChangelogDetailResponse {
    data: Changelog;
    error?: string;
}
