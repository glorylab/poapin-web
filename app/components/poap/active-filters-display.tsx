import React from 'react';
import { Chip, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ActiveFiltersDisplayProps {
    selectedFilters: { [key: string]: string[] };
    onFilterRemove: (key: string, value: string) => void;
    onClearAll: () => void;
}

export function ActiveFiltersDisplay({ 
    selectedFilters, 
    onFilterRemove, 
    onClearAll 
}: ActiveFiltersDisplayProps) {
    // Check if any filters are active
    const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0);
    
    if (!hasActiveFilters) {
        return null;
    }

    // Get all active filter entries
    const activeFilterEntries = Object.entries(selectedFilters).filter(([key, values]) => values.length > 0);
    const totalActiveFilters = Object.values(selectedFilters).reduce((count, values) => count + values.length, 0);

    return (
        <div className="mb-6 p-4 bg-gradient-to-r from-background-50/80 to-background-50/50 backdrop-blur-sm rounded-xl border border-background-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon icon="heroicons:funnel" className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-background-800">
                        Active Filters ({totalActiveFilters})
                    </span>
                </div>
                <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<Icon icon="heroicons:x-mark" className="w-4 h-4" />}
                    onPress={onClearAll}
                    className="text-xs"
                >
                    Clear All
                </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {activeFilterEntries.map(([filterKey, values]) => 
                    values.map((value) => (
                        <Chip
                            key={`${filterKey}-${value}`}
                            variant="flat"
                            color="primary"
                            size="sm"
                            onClose={() => onFilterRemove(filterKey, value)}
                            classNames={{
                                base: "bg-gradient-to-r from-background-100 to-background-100 border border-background-200/50 hover:from-background-200 hover:to-background-200 transition-all duration-200",
                                content: "text-background-800 font-medium",
                                closeButton: "text-background-600 hover:text-background-800"
                            }}
                        >
                            <span className="flex items-center gap-1">
                                <span className="text-xs opacity-75">{filterKey}:</span>
                                <span>{value}</span>
                            </span>
                        </Chip>
                    ))
                )}
            </div>
        </div>
    );
}
