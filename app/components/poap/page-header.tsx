import { Button } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { SortSelector } from "./sort-selector";

interface PageHeaderProps {
    address: string;
    poapCount: number;
    totalMomentsCount: number;
    selectedSort: string;
    onSortChange: (sort: string) => void;
}

export function PageHeader({ 
    address, 
    poapCount, 
    totalMomentsCount, 
    selectedSort, 
    onSortChange
}: PageHeaderProps) {
    return (
        <header className="relative z-20 mx-4 px-4 mt-4 flex flex-col gap-2 rounded-medium bg-default-50 bg-opacity-30 backdrop-blur-sm pb-3 pt-2 md:pt-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-row grow gap-2">
                    <div className="flex items-center gap-1">
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
