export interface CardHighlight {
    id: string;
    address: string;
    description: string | null;
    status: string;
    theme: string;
}

export interface Card {
    id: number;
    status: string;
    user_created: string;
    date_created: string;
    user_updated: string;
    date_updated: string;
    intro_title: string;
    intro_description: string;
    highlights: string[];
}

export interface CardWithHighlights {
    card: Card;
    highlights: CardHighlight[];
}

export interface CardResponse {
    data?: CardWithHighlights;
    error?: string;
}

export interface PoapCard {
    title: string;
    description: string;
    address: string;
    src: string;
}
