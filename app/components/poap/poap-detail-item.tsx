import React from "react";
import {
    Chip,
} from "@nextui-org/react";

import { cn } from "~/src/cn";
import { POAPDetail } from "~/types/poap";

export type POAPDetailItemColor = {
    name: string;
    hex: string;
};

export type POAPDetailItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
    isPopular?: boolean;
    isLoading?: boolean;
    poap: POAPDetail;
} & POAPDetail;

const POAPDetailItem = React.forwardRef<HTMLDivElement, POAPDetailItemProps>(
    (
        {
            poap: { event, supply },
            className,
            ...props
        },
        ref,
    ) => {

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex flex-col gap-4 pb-12 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:py-12",
                    className,
                )}
                {...props}
            >
                <div className="group relative h-full w-full flex-none">
                    <img
                        alt={event.name}
                        className="h-full w-full rounded-t-none rounded-b-full md:rounded-l-none md:rounded-r-full transition-all duration-500 ease-in-out group-hover:md:rounded-r-none group-hover:rounded-b-none"
                        src={event.image_url}
                    />
                </div>

                <div className="flex flex-col px-8 py-4">
                    <h1 className="text-3xl text-primary font-bold tracking-tight">{event.name}</h1>
                    <h2 className="sr-only">POAP information</h2>
                    <div className="my-2 flex items-center gap-2">
                    </div>
                    <div className="flex gap-2 pb-1 pt-2">
                        {<Chip className="font-mono" variant="flat">{supply.order}/{supply.total}</Chip>}
                        {event.country && <Chip variant="flat">{event.country}</Chip>}
                        {event.city && <Chip variant="flat">{event.city}</Chip>}
                        {event.year && <Chip variant="flat">{event.year}</Chip>}
                    </div>

                    <div className="mt-4">
                        <p className="sr-only">POAP event description</p>
                        <p className="text-medium text-default-500 whitespace-pre-wrap">{event.description}</p>
                    </div>
                </div>
            </div>
        );
    },
);

POAPDetailItem.displayName = "POAP Detail Item";

export default POAPDetailItem;
