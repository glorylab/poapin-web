import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";

export function createCountryFilter(poaps: POAP[]): Filter {
    return {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Country",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const country = poap.event?.country || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === country)) {
                    acc.push({ title: country, value: country });
                }
                return acc;
            }
            return [{ title: country, value: country }];
        }, [] as Filter["options"]),
    };
}

export function createCityFilter(poaps: POAP[]): Filter {
    return {
        type: FilterTypeEnum.CheckboxGroup,
        title: "City",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const city = poap.event.city || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === city)) {
                    acc.push({ title: city, value: city });
                }
                return acc;
            }
            return [{ title: city, value: city }];
        }, [] as Filter["options"]),
    };
}

export function createYearFilter(poaps: POAP[]): Filter {
    return {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Year",
        options: poaps.reduce((acc: Filter["options"] | undefined, poap) => {
            const year = new Date(poap.created).getFullYear().toString();
            if (!acc) {
                return [{ title: year, value: year }];
            }
            if (!acc.find((option) => option.value === year)) {
                acc.push({ title: year, value: year });
            }
            return acc;
        }, undefined as Filter["options"])?.sort((a, b) => b.value.localeCompare(a.value)) || [],
    };
}

export function createChainFilter(poaps: POAP[]): Filter {
    return {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Chain",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const chain = poap.chain || "mainnet";
            if (acc) {
                if (!acc.find((option) => option.value === chain)) {
                    acc.push({ title: chain, value: chain });
                }
                return acc;
            }
            return [{ title: chain, value: chain }];
        }, [] as Filter["options"]),
    };
}

export function createMomentsFilter(): Filter {
    return {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Moments",
        options: [
            { title: "Has Moments", value: "has_moments" },
            { title: "No Moments", value: "no_moments" },
        ],
    };
}
