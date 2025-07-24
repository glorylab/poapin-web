import React from 'react';
import { Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Avatar } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";
import { cn } from '~/src/cn';

interface FloatingFilterBarProps {
    filters: Filter[];
    selectedFilters: { [key: string]: string[] };
    onFilterChange: (key: string, values: string[]) => void;
    allPoaps: POAP[];
    filteredPoaps: POAP[];
}

// Helper function to get value from POAP based on filter type
const getPoapValue = (poap: POAP, filterTitle: string): string => {
    switch (filterTitle) {
        case 'Country':
            return poap.event.country || '(None)';
        case 'City':
            return poap.event.city || '(None)';
        case 'Year':
            return new Date(poap.created).getFullYear().toString();
        case 'Chain':
            return poap.chain || 'mainnet';
        default:
            return '(None)';
    }
};

// Helper function to calculate counts for filter options
const calculateOptionCounts = (allPoaps: POAP[], filteredPoaps: POAP[], filterTitle: string) => {
    const allCounts: { [key: string]: number } = {};
    const filteredCounts: { [key: string]: number } = {};

    // Count in all POAPs
    allPoaps.forEach(poap => {
        const value = getPoapValue(poap, filterTitle);
        allCounts[value] = (allCounts[value] || 0) + 1;
    });

    // Count in filtered POAPs
    filteredPoaps.forEach(poap => {
        const value = getPoapValue(poap, filterTitle);
        filteredCounts[value] = (filteredCounts[value] || 0) + 1;
    });

    return { allCounts, filteredCounts };
};

export function FloatingFilterBar({
    filters,
    selectedFilters,
    onFilterChange,
    allPoaps,
    filteredPoaps
}: FloatingFilterBarProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Store previous filter states for intelligent toggle
    const [previousFilterStates, setPreviousFilterStates] = React.useState<Record<string, Record<string, string[]>>>({});

    // Function to get selection state of a filter option
    const getSelectionState = (filterTitle: string, optionValue: string) => {
        // Get all POAPs that match this option
        const matchingPoaps = allPoaps.filter(poap => {
            switch (filterTitle) {
                case 'Country':
                    return (poap.event.country || '(None)') === optionValue;
                case 'City':
                    return (poap.event.city || '(None)') === optionValue;
                case 'Year':
                    return poap.event.year.toString() === optionValue;
                case 'Chain':
                    return poap.chain === optionValue;
                default:
                    return false;
            }
        });

        // Get POAPs that match this option AND are currently visible
        const visibleMatchingPoaps = matchingPoaps.filter(poap =>
            filteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
        );

        // Check if this option is explicitly selected
        const isExplicitlySelected = selectedFilters[filterTitle]?.includes(optionValue) || false;

        if (isExplicitlySelected) {
            return 'fully-selected'; // User explicitly selected this option
        } else if (visibleMatchingPoaps.length > 0 && visibleMatchingPoaps.length < matchingPoaps.length) {
            return 'partially-selected'; // Some POAPs visible due to other filters
        } else if (visibleMatchingPoaps.length === matchingPoaps.length && matchingPoaps.length > 0) {
            // Check if this is truly a default state (no filters applied) or a result of other filters
            const hasAnyFilters = Object.values(selectedFilters).some(filters => filters.length > 0);
            if (!hasAnyFilters) {
                return 'unselected'; // Default state - no filters applied, treat as unselected
            } else {
                return 'partially-selected'; // All POAPs visible due to other filters
            }
        } else {
            return 'unselected'; // No POAPs visible
        }
    };

    // Enhanced filter change handler with intelligent toggle
    const handleIntelligentFilterChange = (filterTitle: string, optionValue: string) => {
        const currentState = getSelectionState(filterTitle, optionValue);
        const currentSelections = selectedFilters[filterTitle] || [];
        const hasAnyFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

        console.log('handleIntelligentFilterChange:', {
            filterTitle,
            optionValue,
            currentState,
            currentSelections,
            hasAnyFilters
        });

        if (currentState === 'unselected') {
            // Check if this is the default state (no filters applied)
            if (!hasAnyFilters) {
                // Default state: clicking should single-select this option
                onFilterChange(filterTitle, [optionValue]);
            } else {
                // Normal unselected state: add this option to existing selections
                const newSelections = [...currentSelections, optionValue];
                onFilterChange(filterTitle, newSelections);
            }
        } else if (currentState === 'partially-selected') {
            // Store current state and add this option to current filter (expand to full selection)
            const stateKey = `${filterTitle}-${optionValue}`;
            setPreviousFilterStates(prev => ({
                ...prev,
                [stateKey]: { ...selectedFilters }
            }));

            // Add this option to the current filter's selections
            // This preserves other filters and only affects the current filter
            const newSelections = currentSelections.includes(optionValue)
                ? currentSelections
                : [...currentSelections, optionValue];
            onFilterChange(filterTitle, newSelections);
        } else if (currentState === 'fully-selected') {
            // Check if we have a previous state to restore
            const stateKey = `${filterTitle}-${optionValue}`;
            const previousState = previousFilterStates[stateKey];

            if (previousState && selectedFilters[filterTitle]?.includes(optionValue)) {
                // Restore previous partial state
                Object.entries(previousState).forEach(([key, values]) => {
                    onFilterChange(key, values);
                });

                // Clear the stored state
                setPreviousFilterStates(prev => {
                    const newState = { ...prev };
                    delete newState[stateKey];
                    return newState;
                });
            } else {
                // Remove this option (deselect)
                const newSelections = currentSelections.filter(val => val !== optionValue);
                onFilterChange(filterTitle, newSelections);
            }
        }
    };

    // Function to render POAP avatars for a filter option
    const renderPOAPAvatars = (filterTitle: string, optionValue: string) => {
        // Get POAPs that match this filter option
        const matchingPoaps = allPoaps.filter(poap => {
            switch (filterTitle) {
                case 'Country':
                    return (poap.event.country || '(None)') === optionValue;
                case 'City':
                    return (poap.event.city || '(None)') === optionValue;
                case 'Year':
                    return poap.event.year.toString() === optionValue;
                case 'Chain':
                    return poap.chain === optionValue;
                default:
                    return false;
            }
        });

        // Get the selection state for this option
        const selectionState = getSelectionState(filterTitle, optionValue);

        // POAPs that match this option AND are currently visible (filtered)
        const visiblePoaps = matchingPoaps.filter(poap =>
            filteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
        );

        // POAPs that match this option but are NOT currently visible (filtered out)
        const hiddenPoaps = matchingPoaps.filter(poap =>
            !filteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
        );

        // Determine how to display based on selection state
        let selectedPoaps: typeof matchingPoaps = [];
        let unselectedPoaps: typeof matchingPoaps = [];

        if (selectionState === 'fully-selected') {
            // Show ALL matching POAPs as selected when explicitly selected
            selectedPoaps = matchingPoaps;  // 所有匹配的 POAP
            unselectedPoaps = [];           // 没有未选中的
        } else if (selectionState === 'partially-selected') {
            // Show visible as selected (with special styling), hidden as unselected
            selectedPoaps = visiblePoaps;
            unselectedPoaps = hiddenPoaps;
        } else {
            // Show all as unselected
            selectedPoaps = [];
            unselectedPoaps = matchingPoaps;
        }

        // Limit display: max 3 unselected, show count if more
        const maxUnselected = 3;
        const displayUnselected = unselectedPoaps.slice(0, maxUnselected);
        const remainingUnselected = unselectedPoaps.length - maxUnselected;

        // Limit selected display: max 3, show count if more
        const maxSelected = 3;
        const displaySelected = selectedPoaps.slice(0, maxSelected);
        const remainingSelected = selectedPoaps.length - maxSelected;

        // Determine border style based on selection state
        const selectedBorderClass = selectionState === 'partially-selected'
            ? "w-6 h-6 border-2 border-yellow-500 border-dashed" // Dashed yellow for partial
            : "w-6 h-6 border-2 border-green-500"; // Solid green for full

        return (
            <div className="flex items-center gap-1">
                {/* Selected POAPs */}
                {displaySelected.map((poap, index) => (
                    <Avatar
                        key={`selected-${poap.tokenId}`}
                        src={`${poap.event.image_url}?size=xsmall`}
                        alt={poap.event.name}
                        size="sm"
                        className={selectedBorderClass}
                    />
                ))}

                {/* Show count if more selected */}
                {remainingSelected > 0 && (
                    <div className={`h-6 bg-green-500 text-white text-xs flex items-center justify-center font-mono font-medium ${
                        remainingSelected.toString().length <= 1 
                            ? 'px-1 rounded-full' 
                            : 'px-2 rounded-full'
                    }`}>
                        +{remainingSelected}
                    </div>
                )}

                {/* Separator dot if both selected and unselected exist */}
                {selectedPoaps.length > 0 && unselectedPoaps.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-gray-400 mx-1"></div>
                )}

                {/* Unselected POAPs */}
                {displayUnselected.map((poap, index) => (
                    <Avatar
                        key={`unselected-${poap.tokenId}`}
                        src={`${poap.event.image_url}?size=xsmall`}
                        alt={poap.event.name}
                        size="sm"
                        className="w-6 h-6 opacity-60"
                    />
                ))}

                {/* Show count if more unselected */}
                {remainingUnselected > 0 && (
                    <div className={`h-6 bg-gray-400 text-white text-xs flex items-center justify-center font-mono font-medium ${
                        remainingUnselected.toString().length <= 1
                            ? 'px-1 rounded-full' 
                            : 'px-2 rounded-full'
                    }`}>
                        +{remainingUnselected}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Floating Filter Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <div className="relative p-[1px] rounded-full bg-gradient-to-br from-white/80 to-white/20">
                    <Button
                        isIconOnly
                        className="w-14 h-14 bg-black/50 hover:bg-black/70 hover:!opacity-100 backdrop-blur-sm text-primary/80 shadow-lg"
                        radius="full"
                        onPress={onOpen}
                    >
                        <Icon icon="heroicons:funnel" className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Filter Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onClose}
                size="2xl"
                placement="auto"
                hideCloseButton
                classNames={{
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    base: "bg-white",
                    header: "border-b border-gray-200",
                    body: "py-6",
                    footer: "border-t border-gray-200"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:funnel" className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-xl font-semibold">Filter POAPs</h2>
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({filteredPoaps.length}/{allPoaps.length} selected)
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Refine your POAP collection by country, city, year, or blockchain
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 gap-4">
                                    {filters.map((filter, index) => {
                                        // Calculate counts for this filter
                                        const { allCounts, filteredCounts } = calculateOptionCounts(allPoaps, filteredPoaps, filter.title);
                                        console.log(`Filter: ${filter.title}`, { allCounts, filteredCounts, allPoapsLength: allPoaps.length, filteredPoapsLength: filteredPoaps.length });

                                        return (
                                            <div key={`filter-${index}`} className="space-y-2">
                                                <Select
                                                    label={filter.title}
                                                    placeholder={`Select ${filter.title.toLowerCase()}`}
                                                    selectionMode="multiple"
                                                    selectedKeys={selectedFilters[filter.title] || []}
                                                    onSelectionChange={(keys) => {
                                                        const newValues = keys === "all" ? [] : Array.from(keys).map(key => String(key));
                                                        const currentValues = selectedFilters[filter.title] || [];

                                                        // Find which option was clicked (added or removed)
                                                        const addedValues = newValues.filter(v => !currentValues.includes(v));
                                                        const removedValues = currentValues.filter(v => !newValues.includes(v));

                                                        if (addedValues.length === 1) {
                                                            // Single option was added - use intelligent logic
                                                            const optionValue = addedValues[0];
                                                            handleIntelligentFilterChange(filter.title, optionValue);
                                                        } else if (removedValues.length === 1) {
                                                            // Single option was removed - use intelligent logic
                                                            const optionValue = removedValues[0];
                                                            handleIntelligentFilterChange(filter.title, optionValue);
                                                        } else {
                                                            // Multiple changes or other cases - use original logic
                                                            onFilterChange(filter.title, newValues);
                                                        }
                                                    }}
                                                    variant="faded"
                                                    color="primary"
                                                    size="md"
                                                    isMultiline={true}
                                                    renderValue={(items) => {
                                                        return (
                                                            <div className="flex flex-wrap gap-1">
                                                                {items.map((item) => {
                                                                    // Find the option title from the filter options
                                                                    const keyString = String(item.key);
                                                                    const option = filter.options?.find(opt => opt.value === keyString);
                                                                    return (
                                                                        <Chip
                                                                            key={keyString}
                                                                            size="sm"
                                                                            variant="flat"
                                                                            className='group-data-[has-value=true]:text-primary-500 group-data-[has-value=true]:bg-background-500'
                                                                        >
                                                                            {option?.title || keyString}
                                                                        </Chip>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    }}
                                                    classNames={{
                                                        base: "z-100 data-[has-value=true]:text-green",
                                                        label: "text-gray-700 group-data-[has-value=true]:font-bold",
                                                        value: "text-gray-900 group-data-[has-value=true]:text-black",
                                                    }}
                                                >
                                                    {filter.options?.map((option) => {
                                                        const selectionState = getSelectionState(filter.title, option.value);

                                                        return (
                                                            <SelectItem
                                                                key={option.value}
                                                                textValue={option.title}
                                                                endContent={renderPOAPAvatars(filter.title, option.value)}
                                                                classNames={{
                                                                    base: cn(
                                                                        'cursor-pointer py-2 px-2 rounded-md',
                                                                        selectionState === 'partially-selected' 
                                                                            ? '!bg-yellow-100 hover:!bg-yellow-200 active:!bg-yellow-50' 
                                                                            : selectionState === 'fully-selected' 
                                                                            ? '!bg-green-100 hover:!bg-green-200 active:!bg-green-50'
                                                                            : '!bg-gray-50 hover:!bg-gray-100 active:!bg-gray-25'
                                                                    ),
                                                                    wrapper: "",
                                                                    title: `text-gray-900 hover:text-gray-900 active:text-gray-900 py-2 px-2 rounded-md ${selectionState === 'partially-selected' ? 'text-yellow-700' :
                                                                        selectionState === 'fully-selected' ? 'text-green-700 font-bold' : ''
                                                                        }`,
                                                                    selectedIcon: selectionState === 'partially-selected' ? "text-yellow-700" : "text-green-700",
                                                                }}
                                                            >
                                                                {option.title}
                                                            </SelectItem>
                                                        );
                                                    }) || []}
                                                </Select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={() => {
                                        // Clear all filters
                                        filters.forEach(filter => {
                                            onFilterChange(filter.title, []);
                                        });
                                    }}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    color="primary"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onPress={onClose}
                                >
                                    Apply Filters
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
