import React, { useState, useEffect } from 'react';
import { Chip, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigation } from '@remix-run/react';
import { useAtom } from 'jotai';
import { filterStateAtom, hasActiveFiltersAtom, activeFilterCountAtom } from '~/atoms/filter-atoms';

interface ActiveFiltersDisplayProps {
    onFilterRemove: (key: string, value: string) => void;
    onClearAll: () => void;
}

export function ActiveFiltersDisplay({
    onFilterRemove,
    onClearAll
}: ActiveFiltersDisplayProps) {
    // Use Jotai global state
    const [selectedFilters] = useAtom(filterStateAtom);
    const [hasActiveFilters] = useAtom(hasActiveFiltersAtom);
    const [totalActiveFilters] = useAtom(activeFilterCountAtom);
    const navigation = useNavigation();

    // Loading states
    const [loadingFilters, setLoadingFilters] = useState<Set<string>>(new Set());
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [previousFilters, setPreviousFilters] = useState(selectedFilters);

    // Monitor navigation state and filter changes to clear loading states
    useEffect(() => {
        // If navigation is idle and filters have changed, clear loading states
        if (navigation.state === 'idle') {
            // Check if filters have actually changed
            const filtersChanged = JSON.stringify(selectedFilters) !== JSON.stringify(previousFilters);

            if (filtersChanged) {
                // Clear loading states after a short delay to show the spinner briefly
                const timer = setTimeout(() => {
                    setLoadingFilters(new Set());
                    setIsClearingAll(false);
                    setPreviousFilters(selectedFilters);
                }, 300);

                return () => clearTimeout(timer);
            }
        }
    }, [navigation.state, selectedFilters, previousFilters]);

    // Handle filter removal with loading state
    const handleFilterRemove = async (key: string, value: string) => {
        const filterId = `${key}-${value}`;
        if (loadingFilters.has(filterId) || isClearingAll) return; // Prevent duplicate clicks

        setLoadingFilters(prev => new Set(prev).add(filterId));

        try {
            await onFilterRemove(key, value);
        } catch (error) {
            // If there's an error, clear the loading state immediately
            setLoadingFilters(prev => {
                const newSet = new Set(prev);
                newSet.delete(filterId);
                return newSet;
            });
            throw error;
        }
        // Loading state will be cleared by useEffect when navigation completes
    };

    // Handle clear all with loading state
    const handleClearAll = async () => {
        if (isClearingAll || loadingFilters.size > 0) return; // Prevent duplicate clicks

        setIsClearingAll(true);

        try {
            await onClearAll();
        } catch (error) {
            // If there's an error, clear the loading state immediately
            setIsClearingAll(false);
            throw error;
        }
        // Loading state will be cleared by useEffect when navigation completes
    };

    if (!hasActiveFilters) {
        return null;
    }

    // Get all active filter entries
    const activeFilterEntries = Object.entries(selectedFilters).filter(([key, values]) => values.length > 0);

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
                    startContent={
                        isClearingAll ? (
                            <Spinner size="sm" className="w-4 h-4" />
                        ) : (
                            <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                        )
                    }
                    onPress={handleClearAll}
                    isDisabled={isClearingAll || loadingFilters.size > 0}
                    className="text-xs"
                >
                    {isClearingAll ? 'Clearing...' : 'Clear All'}
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {activeFilterEntries.map(([filterKey, values]) =>
                    values.map((value) => {
                        const filterId = `${filterKey}-${value}`;
                        const isLoading = loadingFilters.has(filterId);

                        return (
                            <Chip
                                key={filterId}
                                variant="flat"
                                color="primary"
                                size="sm"
                                onClose={isLoading || isClearingAll ? undefined : () => handleFilterRemove(filterKey, value)}
                                classNames={{
                                    base: `bg-gradient-to-r from-background-100 to-background-100 border border-background-200/50 hover:from-background-200 hover:to-background-200 transition-all duration-200 ${isLoading || isClearingAll ? 'opacity-60 cursor-not-allowed' : ''}`,
                                    content: "text-background-800 font-medium",
                                    closeButton: "text-background-600 hover:text-background-800"
                                }}
                                endContent={
                                    isLoading ? (
                                        <div className="flex items-center justify-center w-4 h-4">
                                            <Spinner 
                                                size="sm" 
                                                color='warning'
                                                classNames={{
                                                    wrapper: "w-3 h-3",
                                                    circle1: "w-3 h-3",
                                                    circle2: "w-3 h-3"
                                                }}
                                            />
                                        </div>
                                    ) : undefined
                                }
                            >
                                <span className="flex items-center gap-1">
                                    <span className="text-xs opacity-75">{filterKey}:</span>
                                    <span>{value}</span>
                                </span>
                            </Chip>
                        );
                    })
                )}
            </div>
        </div>
    );
}
