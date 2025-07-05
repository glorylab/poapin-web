import { Button } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { SortSelector } from "./sort-selector";

interface PageHeaderProps {
    address: string;
    poapCount: number;
    totalMomentsCount: number;
    selectedSort: string;
    onSortChange: (sort: string) => void;
    onFilterOpen: () => void;
}

export function PageHeader({ 
    address, 
    poapCount, 
    totalMomentsCount, 
    selectedSort, 
    onSortChange, 
    onFilterOpen 
}: PageHeaderProps) {
    return (
        <header className="relative z-20 mx-4 px-4 mt-4 flex flex-col gap-2 rounded-medium bg-default-50 bg-opacity-30 backdrop-blur-sm pb-3 pt-2 md:pt-3">
            <div className="flex items-center gap-1 md:hidden md:gap-2">
                <h1 className="text-large font-medium text-background-700">{address}</h1>
                <span className="text-small text-background-500">({poapCount})</span>
                <span className="text-small text-background-500">
                    {totalMomentsCount > 0 ? ` (${totalMomentsCount} moments)` : ""}
                </span>
            </div>
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-row grow gap-2">
                    <Button
                        className="flex md:hidden border-background-200 hover:border-background-100 bg-background-100 bg-opacity-20 hover:bg-background-100 hover:bg-opacity-70 active:bg-opacity-70 text-background-600 hover:text-background-800 active:text-background-800"
                        startContent={
                            <Icon
                                className="text-background-600 hover:text-background-800 active:text-background-800"
                                height={16}
                                icon="solar:filter-linear"
                                width={16}
                            />
                        }
                        variant="bordered"
                        onPress={onFilterOpen}
                    >
                        Filters
                    </Button>
                    <div className="hidden items-center gap-1 md:flex">
                        <h1 className="text-medium font-medium text-background-700">{address}</h1>
                        <span className="text-small text-background-500">({poapCount})</span>
                        <span className="text-small text-background-500">
                            {totalMomentsCount > 0 ? ` (${totalMomentsCount} moments)` : ""}
                        </span>
                    </div>
                </div>
                <SortSelector selectedSort={selectedSort} onSortChange={onSortChange} />
            </div>
        </header>
    );
}
