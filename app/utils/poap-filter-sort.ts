import type { POAP } from "~/types/poap";

export function filterPoaps(
    poaps: POAP[],
    selectedFilters: { [key: string]: string[] },
    dropsWithMoments: number[]
): POAP[] {
    return poaps.filter((poap) => {
        // Get all active filter entries (with non-empty values)
        const activeFilters = Object.entries(selectedFilters).filter(([key, values]) => values.length > 0);

        // If no filters are active, show all POAPs
        if (activeFilters.length === 0) return true;

        // Check if POAP matches ANY of the active filter values (OR logic)
        return activeFilters.some(([key, values]) => {
            switch (key) {
                case "Country":
                    return values.includes(poap.event.country || "(None)");
                case "City":
                    return values.includes(poap.event.city || "(None)");
                case "Chain":
                    return values.includes(poap.chain);
                case "Year":
                    return values.includes(new Date(poap.created).getFullYear().toString());
                case "Moments":
                    const hasMoments = dropsWithMoments.includes(poap.event.id);
                    if (values.includes("has_moments") && hasMoments) return true;
                    if (values.includes("no_moments") && !hasMoments) return true;
                    return false;
                default:
                    return false;
            }
        });
    });
}

export function sortPoaps(
    poaps: POAP[],
    selectedSort: string,
    dropsWithMoments: number[]
): POAP[] {
    return poaps.sort((a, b) => {
        switch (selectedSort) {
            case "collected_newest":
                return new Date(b.created).getTime() - new Date(a.created).getTime();
            case "collected_oldest":
                return new Date(a.created).getTime() - new Date(b.created).getTime();
            case "start_date_newest":
                return new Date(b.event.start_date).getTime() - new Date(a.event.start_date).getTime();
            case "start_date_oldest":
                return new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime();
            case "most_moments":
                // Use inline function since getMomentsCountOfDrop was moved to utils
                const getMomentsCount = (poap: POAP) => dropsWithMoments.includes(poap.event.id) ? 1 : 0;
                return getMomentsCount(b) - getMomentsCount(a);
            case "most_popular":
                return b.event.supply - a.event.supply;
            default:
                return new Date(b.created).getTime() - new Date(a.created).getTime();
        }
    });
}
