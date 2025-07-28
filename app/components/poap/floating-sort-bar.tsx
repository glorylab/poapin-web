import React from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Listbox, ListboxItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { SortState } from '~/atoms/poap-state';
import { PlausibleEvents } from '~/utils/usePlausible';

interface FloatingSortBarProps {
    selectedSort: SortState;
    onSortChange: (sort: SortState) => void;
    address?: string;
}

export function FloatingSortBar({ selectedSort, onSortChange, address }: FloatingSortBarProps) {
    const { isOpen, onOpen: originalOnOpen, onClose } = useDisclosure();
    
    // Custom onOpen handler with tracking
    const handleModalOpen = () => {
        originalOnOpen();
        // Track sort modal opening
        if (address) {
            PlausibleEvents.trackSortModalOpen(address);
        }
    };

    const sortOptions = [
        { key: "date", direction: "desc" as const, label: "Collected date: Newest", icon: "heroicons:arrow-down" },
        { key: "date", direction: "asc" as const, label: "Collected date: Oldest", icon: "heroicons:arrow-up" },
        { key: "start_date", direction: "desc" as const, label: "Start Date: Newest", icon: "heroicons:calendar" },
        { key: "start_date", direction: "asc" as const, label: "Start Date: Oldest", icon: "heroicons:calendar" },
        { key: "popularity", direction: "desc" as const, label: "Most Popular", icon: "heroicons:fire" },
        { key: "moments", direction: "desc" as const, label: "Most Moments", icon: "heroicons:photo" }
    ];

    const handleSortSelect = (optionKey: string) => {
        const option = sortOptions.find(opt => `${opt.key}_${opt.direction}` === optionKey);
        if (option) {
            onSortChange({ key: option.key, direction: option.direction });
        }
        onClose();
    };

    const getCurrentSortLabel = () => {
        const currentOption = sortOptions.find(option => 
            option.key === selectedSort.key && option.direction === selectedSort.direction
        );
        return currentOption?.label || "Sort";
    };

    const getCurrentSortIcon = () => {
        const currentOption = sortOptions.find(option => 
            option.key === selectedSort.key && option.direction === selectedSort.direction
        );
        return currentOption?.icon || "heroicons:bars-3";
    };

    return (
        <>
            {/* Floating Sort Button */}
            <div className="fixed bottom-6 left-24 z-50">
                <div className="relative p-[1px] rounded-full bg-gradient-to-br from-white/80 to-white/20">
                    <Button
                        isIconOnly
                        className="w-14 h-14 bg-black/50 hover:bg-black/70 hover:!opacity-100 backdrop-blur-sm text-primary/80 shadow-lg"
                        radius="full"
                        onPress={handleModalOpen}
                    >
                        <Icon icon="heroicons:bars-arrow-up" className="w-6 h-6" />
                    </Button>
                    
                    {/* Sort Badge - always show current sort icon */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-white/50 to-white/20 rounded-full flex items-center justify-center shadow-lg border-2 border-white backdrop-blur-sm">
                        <Icon 
                            icon={getCurrentSortIcon()} 
                            className="w-3 h-3 text-white/90" 
                        />
                    </div>
                </div>
            </div>

            {/* Sort Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onClose}
                size="md"
                placement="auto"
                hideCloseButton
                classNames={{
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    base: "bg-white",
                    header: "border-b border-gray-200",
                    body: "p-0",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-gray-900">Sort POAPs</h2>
                        <p className="text-sm text-gray-500">Choose how to sort your POAP collection</p>
                    </ModalHeader>
                    <ModalBody>
                        <Listbox
                            aria-label="Sort options"
                            selectedKeys={[`${selectedSort.key}_${selectedSort.direction}`]}
                            selectionMode="single"
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0];
                                if (typeof selectedKey === "string") {
                                    handleSortSelect(selectedKey);
                                }
                            }}
                            classNames={{
                                base: "max-w-full",
                                list: "max-h-[300px] overflow-scroll",
                            }}
                        >
                            {sortOptions.map((option) => {
                                const optionKey = `${option.key}_${option.direction}`;
                                const isSelected = option.key === selectedSort.key && option.direction === selectedSort.direction;
                                
                                return (
                                    <ListboxItem
                                        key={optionKey}
                                        startContent={
                                            <Icon 
                                                icon={option.icon} 
                                                className={`w-5 h-5 ${
                                                    isSelected ? 'text-green-700' : 'text-gray-500'
                                                }`} 
                                            />
                                        }
                                        classNames={{
                                            base: `py-3 px-4 cursor-pointer rounded-md ${
                                                isSelected 
                                                    ? '!bg-green-100 hover:!bg-green-200 active:!bg-green-50' 
                                                    : '!bg-gray-50 hover:!bg-gray-100 active:!bg-gray-25'
                                            }`,
                                            title: `${
                                                isSelected 
                                                    ? 'text-green-700 font-bold' 
                                                    : 'text-gray-900 font-medium'
                                            }`,
                                            selectedIcon: "text-green-700",
                                        }}
                                    >
                                        {option.label}
                                    </ListboxItem>
                                );
                            })}
                        </Listbox>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
