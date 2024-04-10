"use client";

import type { Filter } from "app/types/filter";

import React from "react";
import {
    Accordion,
    AccordionItem,
    Button,
    Checkbox,
    CheckboxGroup,
    Divider,
    ScrollShadow,
    Switch,
    Tab,
    Tabs,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { cn } from "app/src/cn";
import { FilterTypeEnum } from "app/types/filter";

import TagGroupItem from "app/components/poap/tag-group-item";

export type FiltersWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
    items: Filter[];
    title?: string;
    showTitle?: boolean;
    showActions?: boolean;
    className?: string;
    scrollShadowClassName?: string;
    onFilterChange?: (key: string, values: string[]) => void;
};

const FiltersWrapper = React.forwardRef<HTMLDivElement, FiltersWrapperProps>(
    (
        {
            items,
            title = "Filters",
            showTitle = true,
            showActions = true,
            className,
            scrollShadowClassName,
            onFilterChange,
        },
        ref,
    ) => {
        const renderFilter = React.useCallback((filter: Filter) => {
            switch (filter.type) {
                case FilterTypeEnum.Tabs:
                    return (
                        <Tabs fullWidth aria-label={filter.title}>
                            {filter.options?.map((option) => <Tab key={option.value} title={option.title} />)}
                        </Tabs>
                    );

                case FilterTypeEnum.TagGroup:
                    return (
                        <CheckboxGroup aria-label="Select amenities" className="gap-1" orientation="horizontal">
                            {filter.options?.map((option) => (
                                <TagGroupItem key={option.value} icon={option.icon} value={option.value}>
                                    {option.title}
                                </TagGroupItem>
                            ))}
                        </CheckboxGroup>
                    );
                case FilterTypeEnum.Toggle:
                    return (
                        <div className="-mx-4 flex flex-col">
                            {filter.options?.map((option) => (
                                <Switch
                                    key={option.value}
                                    classNames={{
                                        base: cn(
                                            "inline-flex flex-row-reverse w-full max-w-sm bg-content1 hover:bg-content2 items-center",
                                            "justify-between cursor-pointer rounded-lg gap-2 -mr-2 px-4 py-3",
                                        ),
                                        wrapper: "mr-0",
                                    }}
                                    value={option.value}
                                >
                                    <div className="flex flex-col gap-1">
                                        <p className="text-medium">{option.title}</p>
                                        <p className="text-tiny text-default-400">{option.description}</p>
                                    </div>
                                </Switch>
                            ))}
                        </div>
                    );
                case FilterTypeEnum.CheckboxGroup:
                    return (
                        <Accordion
                            className="px-0"
                            defaultExpandedKeys={filter?.defaultOpen ? ["options"] : []}
                        >
                            <AccordionItem
                                key="options"
                                classNames={{
                                    title: "text-medium font-medium leading-8 text-default-600",
                                    trigger: "p-0",
                                    content: "px-1",
                                }}
                                title={filter.title}
                            >
                                {filter.type === FilterTypeEnum.CheckboxGroup && (
                                    <CheckboxGroup
                                        label={filter.title}
                                        onChange={(values) => {
                                            if (Array.isArray(values)) {
                                                handleCheckboxGroupChange(filter.title, values);
                                            }
                                        }}
                                    >
                                        {filter.options?.map((option) => (
                                            <Checkbox key={option.value} value={option.value}>
                                                {option.title}
                                            </Checkbox>
                                        ))}
                                    </CheckboxGroup>
                                )}
                            </AccordionItem>
                        </Accordion>
                    );
            }
        }, []);

        const handleCheckboxGroupChange = (key: string, values: string[]) => {
            if (onFilterChange) {
                onFilterChange(key, values);
            }
        };

        return (
            <div
                ref={ref}
                className={cn("h-full my-4 max-h-fit w-full max-w-xs rounded-medium bg-content1 p-6", className)}
            >
                {showTitle && (
                    <>
                        <h3 className="text-large font-medium text-background-700">{title}</h3>
                        <Divider className="my-3 bg-default-100" />
                    </>
                )}
                <ScrollShadow
                    className={cn(
                        "-mx-6 h-full px-6",
                        {
                            "max-h-[calc(100%_-_220px)]": showActions,
                        },
                        scrollShadowClassName,
                    )}
                >
                    <div className="flex flex-col gap-6">
                        {items.map((filter) => (
                            <div key={filter.title} className="flex flex-col gap-3">
                                {filter.type !== FilterTypeEnum.CheckboxGroup ? (
                                    <div>
                                        <h3 className="text-medium font-medium leading-8 text-default-600">
                                            {filter.title}
                                        </h3>
                                        <p className="text-small text-default-400">{filter.description}</p>
                                    </div>
                                ) : null}
                                {renderFilter(filter)}
                            </div>
                        ))}
                    </div>
                </ScrollShadow>

                {showActions && (
                    <>
                        <Divider className="my-6 bg-default-100" />

                        <div className="mt-auto flex flex-col gap-2">
                            <Button
                                color="primary"
                                startContent={
                                    <Icon
                                        className="text-primary-foreground [&>g]:stroke-[3px]"
                                        icon="solar:magnifer-linear"
                                        width={16}
                                    />
                                }
                            >
                            </Button>
                            <Button className="text-default-500" variant="flat">
                                Clear all filters
                            </Button>
                        </div>
                    </>
                )}
            </div>
        );
    },
);

FiltersWrapper.displayName = "FiltersWrapper";

export default FiltersWrapper;
