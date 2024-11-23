export interface HighLight {
    address: string;
    og_image_url: string;
}

export interface HighLightsResponse {
    data: HighLight[];
    error?: string;
}