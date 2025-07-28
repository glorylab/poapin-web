import type { POAP } from "~/types/poap";
import type { SortState } from "~/atoms/poap-state";

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
    sortState: SortState,
    dropsWithMoments: number[]
): POAP[] {
    return poaps.sort((a, b) => {
        let comparison = 0;
        
        switch (sortState.key) {
            case "date":
            case "collected":
                comparison = new Date(b.created).getTime() - new Date(a.created).getTime();
                break;
            case "start_date":
                comparison = new Date(b.event.start_date).getTime() - new Date(a.event.start_date).getTime();
                break;
            case "moments":
                const getMomentsCount = (poap: POAP) => dropsWithMoments.includes(poap.event.id) ? 1 : 0;
                comparison = getMomentsCount(b) - getMomentsCount(a);
                break;
            case "popularity":
                comparison = b.event.supply - a.event.supply;
                break;
            default:
                comparison = new Date(b.created).getTime() - new Date(a.created).getTime();
        }
        
        // Apply direction (asc/desc)
        return sortState.direction === 'asc' ? -comparison : comparison;
    });
}
