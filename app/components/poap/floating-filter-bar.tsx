import React, { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Avatar } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useAtom } from 'jotai';
import { filterStateAtom, hasActiveFiltersAtom, activeFilterCountAtom } from '~/atoms/filter-atoms';
import type { Filter } from "~/types/filter";
import type { POAP } from "~/types/poap";
import { cn } from '~/src/cn';

interface FloatingFilterBarProps {
    filters: Filter[];
    onFilterChange: (key: string, values: string[]) => void;
    onBatchFilterChange?: (filtersToUpdate: { [key: string]: string[] }) => void;
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

export function FloatingFilterBar({
    filters,
    onFilterChange,
    onBatchFilterChange,
    allPoaps,
    filteredPoaps
}: FloatingFilterBarProps) {
    // Use Jotai global state
    const [selectedFilters] = useAtom(filterStateAtom);
    const [hasActiveFilters] = useAtom(hasActiveFiltersAtom);
    const [activeFilterCount] = useAtom(activeFilterCountAtom);
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Temporary filter state for the modal (doesn't affect URL until Apply is clicked)
    const [tempSelectedFilters, setTempSelectedFilters] = useState<{ [key: string]: string[] }>({});
    
    // Store previous filter states for intelligent toggle
    const [previousFilterStates, setPreviousFilterStates] = useState<Record<string, Record<string, string[]>>>({});
    
    // Performance optimization: defer heavy calculations
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationsReady, setCalculationsReady] = useState(false);
    
    // Custom backdrop for Select components
    const [selectBackdropVisible, setSelectBackdropVisible] = useState(false);
    const [activeSelectId, setActiveSelectId] = useState<string | null>(null);
    
    // Initialize temp state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempSelectedFilters({ ...selectedFilters });
            setCalculationsReady(false);
            setIsCalculating(true);
            
            // Defer heavy calculations to next tick to allow modal to open immediately
            setTimeout(() => {
                setCalculationsReady(true);
                setIsCalculating(false);
            }, 0);
        }
    }, [isOpen, selectedFilters]);
    
    // Calculate filtered POAPs based on temp state for preview (only when calculations are ready)
    const tempFilteredPoaps = React.useMemo(() => {
        if (!calculationsReady) {
            return allPoaps; // Return all POAPs initially to avoid blocking
        }
        
        if (Object.values(tempSelectedFilters).every(values => values.length === 0)) {
            return allPoaps;
        }
        
        return allPoaps.filter((poap) => {
            const activeFilters = Object.entries(tempSelectedFilters).filter(([key, values]) => values.length > 0);
            if (activeFilters.length === 0) return true;
            
            return activeFilters.some(([key, values]) => {
                switch (key) {
                    case "Country":
                        return values.includes(poap.event.country || "(None)");
                    case "City":
                        return values.includes(poap.event.city || "(None)");
                    case "Chain":
                        return values.includes(poap.chain);
                    case "Year":
                        return values.includes(poap.event.year.toString());
                    case "Has Moments":
                        const hasDropsWithMoments = filteredPoaps.some(fp => fp.tokenId === poap.tokenId);
                        if (values.includes("Yes")) return hasDropsWithMoments;
                        if (values.includes("No")) return !hasDropsWithMoments;
                        return false;
                    default:
                        return false;
                }
            });
        });
    }, [tempSelectedFilters, allPoaps, filteredPoaps, calculationsReady]);

    // Function to get selection state of a filter option (using temp state)
    const getSelectionState = (filterTitle: string, optionValue: string): 'fully-selected' | 'partially-selected' | 'unselected' => {
        // Check if this option is explicitly selected in temp state (fast check first)
        const isExplicitlySelected = tempSelectedFilters[filterTitle]?.includes(optionValue) || false;
        if (isExplicitlySelected) {
            return 'fully-selected'; // User explicitly selected this option
        }

        // If calculations are not ready, return unselected for non-selected items to avoid blocking
        if (!calculationsReady) {
            return 'unselected';
        }

        // For unselected options, check if they should be partially-selected
        const hasAnyFilters = Object.values(tempSelectedFilters).some(filters => filters.length > 0);
        if (!hasAnyFilters) {
            return 'unselected'; // Default state - no filters applied
        }

        // Efficient check for partially-selected state
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

        if (matchingPoaps.length === 0) {
            return 'unselected';
        }

        // Check if any of the matching POAPs are visible in current temp filtered results
        const hasVisibleMatches = matchingPoaps.some(poap =>
            tempFilteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
        );

        if (hasVisibleMatches) {
            // Check if all matching POAPs are visible (fully available) or only some (partially available)
            const visibleMatchCount = matchingPoaps.filter(poap =>
                tempFilteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
            ).length;

            if (visibleMatchCount === matchingPoaps.length) {
                // All POAPs for this option are visible - could be partially-selected due to other filters
                return 'partially-selected';
            } else {
                // Only some POAPs for this option are visible - definitely partially-selected
                return 'partially-selected';
            }
        } else {
            return 'unselected'; // No POAPs visible
        }
    };

    // Enhanced filter change handler with intelligent toggle (using temp state)
    const handleIntelligentFilterChange = (filterTitle: string, optionValue: string) => {
        const currentState = getSelectionState(filterTitle, optionValue);
        const currentSelections = tempSelectedFilters[filterTitle] || [];
        const hasAnyFilters = Object.values(tempSelectedFilters).some(filters => filters.length > 0);

        if (currentState === 'unselected') {
            // Check if this is the default state (no filters applied)
            if (!hasAnyFilters) {
                // Default state: clicking should single-select this option
                setTempSelectedFilters(prev => ({
                    ...prev,
                    [filterTitle]: [optionValue]
                }));
            } else {
                // Normal unselected state: add this option to existing selections
                const newSelections = [...currentSelections, optionValue];
                setTempSelectedFilters(prev => ({
                    ...prev,
                    [filterTitle]: newSelections
                }));
            }
        } else if (currentState === 'partially-selected') {
            // Store current state and add this option to current filter (expand to full selection)
            const stateKey = `${filterTitle}-${optionValue}`;
            setPreviousFilterStates(prev => ({
                ...prev,
                [stateKey]: { ...tempSelectedFilters }
            }));

            // Add this option to the current filter's selections
            // This preserves other filters and only affects the current filter
            const newSelections = currentSelections.includes(optionValue)
                ? currentSelections
                : [...currentSelections, optionValue];
            setTempSelectedFilters(prev => ({
                ...prev,
                [filterTitle]: newSelections
            }));
        } else if (currentState === 'fully-selected') {
            // Check if we have a previous state to restore
            const stateKey = `${filterTitle}-${optionValue}`;
            const previousState = previousFilterStates[stateKey];

            if (previousState && tempSelectedFilters[filterTitle]?.includes(optionValue)) {
                // Restore previous partial state
                setTempSelectedFilters({ ...previousState });

                // Clear the stored state
                setPreviousFilterStates(prev => {
                    const newState = { ...prev };
                    delete newState[stateKey];
                    return newState;
                });
            } else {
                // Remove this option (deselect)
                const newSelections = currentSelections.filter(val => val !== optionValue);
                setTempSelectedFilters(prev => ({
                    ...prev,
                    [filterTitle]: newSelections
                }));
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

        // POAPs that match this option AND are currently visible (temp filtered)
        const visiblePoaps = matchingPoaps.filter(poap =>
            tempFilteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
        );

        // POAPs that match this option but are NOT currently visible (temp filtered out)
        const hiddenPoaps = matchingPoaps.filter(poap =>
            !tempFilteredPoaps.some(filtered => filtered.tokenId === poap.tokenId)
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

    // Check if any filters are active (use actual applied filters for the badge)
    // Note: hasActiveFilters and activeFilterCount are now provided by Jotai atoms

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
                    
                    {/* Active Filter Badge */}
                    {hasActiveFilters && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white/50 to-white/20 rounded-full flex items-center justify-center shadow-lg border-2 border-white backdrop-blur-sm">
                            <span className="text-white/90 text-xs font-bold">
                                {activeFilterCount > 9 ? '9+' : activeFilterCount}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Backdrop for Select Components - handled by individual Select styling */}

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
                                    {isCalculating ? (
                                        <span className="ml-2 text-sm font-normal text-gray-500 flex items-center gap-1">
                                            <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </span>
                                    ) : (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({tempFilteredPoaps.length}/{allPoaps.length} selected)
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Refine your POAP collection by country, city, year, or blockchain
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 gap-4">
                                    {filters.map((filter, index) => {
                                        const selectId = `select-${filter.title.toLowerCase().replace(/\s+/g, '-')}`;
                                        const isActiveSelect = activeSelectId === filter.title;
                                        
                                        return (
                                            <div 
                                                key={`filter-${index}`} 
                                                className={`space-y-2 relative transition-all duration-200 ${
                                                    selectBackdropVisible && !isActiveSelect 
                                                        ? 'opacity-40 blur-[1px] pointer-events-none' 
                                                        : selectBackdropVisible && isActiveSelect
                                                        ? 'opacity-100 blur-0 z-[60]'
                                                        : 'opacity-100 blur-0'
                                                }`}
                                            >
                                                <Select
                                                    id={selectId}
                                                    label={filter.title}
                                                    placeholder={`Select ${filter.title.toLowerCase()}`}
                                                    selectionMode="multiple"
                                                    selectedKeys={tempSelectedFilters[filter.title] || []}
                                                    onOpenChange={(isOpen) => {
                                                        setSelectBackdropVisible(isOpen);
                                                        setActiveSelectId(isOpen ? filter.title : null);
                                                    }}
                                                    onSelectionChange={(keys) => {
                                                        const newValues = keys === "all" ? [] : Array.from(keys).map(key => String(key));
                                                        const currentValues = tempSelectedFilters[filter.title] || [];

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
                                                            // Multiple changes or other cases - use temp state directly
                                                            setTempSelectedFilters(prev => ({
                                                                ...prev,
                                                                [filter.title]: newValues
                                                            }));
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
                                                        popoverContent: "bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl z-[60]",
                                                        listbox: "bg-transparent",
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
                            <ModalFooter 
                                className={`transition-all duration-200 ${
                                    selectBackdropVisible 
                                        ? 'opacity-40 blur-[1px] pointer-events-none' 
                                        : 'opacity-100 blur-0'
                                }`}
                            >
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={() => {
                                        // Clear all temp filters
                                        const clearedFilters: { [key: string]: string[] } = {};
                                        filters.forEach(filter => {
                                            clearedFilters[filter.title] = [];
                                        });
                                        setTempSelectedFilters(clearedFilters);
                                    }}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    color="primary"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onPress={() => {
                                        
                                        // Apply temp filters to actual state (URL)
                                        // Use batch update to avoid multiple URL updates
                                        
                                        if (onBatchFilterChange) {
                                            // Use batch update if available
                                            onBatchFilterChange(tempSelectedFilters);
                                        } else {
                                            // Fallback to individual updates
                                            filters.forEach(filter => {
                                                const values = tempSelectedFilters[filter.title] || [];
                                                onFilterChange(filter.title, values);
                                            });
                                        }
                                        onClose();
                                    }}
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
