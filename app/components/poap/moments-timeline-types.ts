// Core interfaces for moments timeline

export interface MomentMedia {
  gateways: {
    url: string;
    type: string;
  }[];
  status: string;
}

export interface MomentLink {
  url: string;
  title: string;
  description?: string;
  image_url?: string;
}

export interface MomentUserTag {
  ens: string | null;
  address: string;
}

export interface MediaGateway {
  metadata?: {
    size?: number;
    width?: number;
    height?: number;
    gateway_type?: string;
  };
  url: string;
  type: string;
}

export interface Media {
  mime_type: string;
  gateways?: MediaGateway[];
}

export interface Moment {
  id: string;
  author: string;
  created_on: string;
  description?: string;
  drops: {
    drop: {
      id: number;
      image_url: string;
      name: string;
      description: string;
      start_date: string;
    };
  }[];
  media?: Media[];
  links?: MomentLink[];
  user_tags?: MomentUserTag[];
}

export interface MomentsApiResponse {
  moments: Moment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

// Constants
export const LOAD_MORE_THRESHOLD = 200; // pixels before bottom to trigger load more
export const CARD_WIDTH = 128; // Width of each POAP card in pixels
export const CARD_GAP = 16; // Gap between POAP cards in pixels
export const MAX_VERTICAL_HEIGHT = 256; // Maximum height for vertical stacking
