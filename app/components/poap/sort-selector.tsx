import { Select, SelectItem } from "@heroui/react";

interface SortSelectorProps {
    selectedSort: string;
    onSortChange: (sort: string) => void;
}

export function SortSelector({ selectedSort, onSortChange }: SortSelectorProps) {
    const sortOptions = [
        { key: "collected_newest", label: "Collected date: Newest" },
        { key: "collected_oldest", label: "Collected date: Oldest" },
        { key: "start_date_newest", label: "Start Date: Newest" },
        { key: "start_date_oldest", label: "Start Date: Oldest" },
        { key: "most_popular", label: "Most Popular" },
        { key: "most_moments", label: "Most Moments" }
    ];

    const selectItemClassNames = {
        title: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
        description: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
        selectedIcon: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
    };

    return (
        <div className="flex grow">
            <Select
                aria-label="Sort by"
                classNames={{
                    base: "items-center justify-end",
                    trigger: "border-background-200 hover:border-background-100 bg-background-100 bg-opacity-20 hover:bg-background-100 hover:bg-opacity-70 active:bg-opacity-70 text-background-600 hover:text-background-800 active:text-background-800",
                    label: "hidden lg:block text-tiny whitespace-nowrap md:text-small text-background-600",
                    mainWrapper: "max-w-xs",
                }}
                defaultSelectedKeys={[selectedSort]}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    if (typeof selectedKey === "string") {
                        onSortChange(selectedKey);
                    }
                }}
                label="Sort by"
                labelPlacement="outside-left"
                placeholder="Select an option"
                variant="bordered"
            >
                {sortOptions.map((option) => (
                    <SelectItem 
                        key={option.key}
                        classNames={selectItemClassNames}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </Select>
        </div>
    );
}
