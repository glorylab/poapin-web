export type Grant = {
    id: number;
    attributes: {
        title: string;
        description: string;
        start_time: string;
        end_time: string;
        grants: {
            id: number;
            title: string;
            description: string | null;
            donors_count: number;
            amount: {
                id: number;
                number: number;
                quantity: string;
            }[];
        }[];
        image: {
            id: number;
            file: {
                data: {
                    id: number;
                    attributes: {
                        url: string;
                        name: string;
                        alternativeText: string;
                        caption: string;
                        width: number;
                        height: number;
                        formats: {
                            thumbnail: {
                                url: string;
                            };
                            large: {
                                url: string;
                            };
                        };
                    };
                };
            };
        };
    };
};


