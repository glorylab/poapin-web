import React from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Listbox, ListboxItem } from '@heroui/react';
import { Icon } from '@iconify/react';

interface FloatingSortBarProps {
    selectedSort: string;
    onSortChange: (sort: string) => void;
}

export function FloatingSortBar({ selectedSort, onSortChange }: FloatingSortBarProps) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const sortOptions = [
        { key: "collected_newest", label: "Collected date: Newest", icon: "heroicons:arrow-down" },
        { key: "collected_oldest", label: "Collected date: Oldest", icon: "heroicons:arrow-up" },
        { key: "start_date_newest", label: "Start Date: Newest", icon: "heroicons:calendar" },
        { key: "start_date_oldest", label: "Start Date: Oldest", icon: "heroicons:calendar" },
        { key: "most_popular", label: "Most Popular", icon: "heroicons:fire" },
        { key: "most_moments", label: "Most Moments", icon: "heroicons:photo" }
    ];

    const handleSortSelect = (key: string) => {
        onSortChange(key);
        onClose();
    };

    const getCurrentSortLabel = () => {
        const currentOption = sortOptions.find(option => option.key === selectedSort);
        return currentOption?.label || "Sort";
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
                        onPress={onOpen}
                    >
                        <Icon icon="heroicons:bars-arrow-up" className="w-6 h-6" />
                    </Button>
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
                            selectedKeys={[selectedSort]}
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
                            {sortOptions.map((option) => (
                                <ListboxItem
                                    key={option.key}
                                    startContent={
                                        <Icon 
                                            icon={option.icon} 
                                            className="w-5 h-5 text-gray-500" 
                                        />
                                    }
                                    classNames={{
                                        base: "py-3 px-4 hover:bg-gray-50 data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-700",
                                        title: "text-gray-900 font-medium",
                                        selectedIcon: "text-primary-600",
                                    }}
                                >
                                    {option.label}
                                </ListboxItem>
                            ))}
                        </Listbox>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
