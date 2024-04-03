import React from "react";
import {
    Chip, Link
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
};

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
                <div className="group relative md:max-w-sm md:aspect-square md:ml-8 overflow-visible p-4">
                    <div className="relative">

                        <img
                            alt={event.name}
                            className="h-full w-full rounded-full transition-all duration-500 ease-in-out object-cover blur-2xl group-hover:blur-lg group-active:blur-xl"
                            src={event.image_url}
                        />
                        <img
                            alt={event.name}
                            className="absolute inset-0 h-full w-full rounded-full object-cover group-hover:p-2 group-active:p-1 transition-all duration-500 ease-in-out"
                            src={event.image_url}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:max-w-sm px-8 py-4 backdrop-blur-xl">
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
                    <div className="flex py-2">
                        {event.event_url && <Link isBlock showAnchorIcon href={event.event_url} target="_blank" color="primary">
                            {event.event_url}
                        </Link>}
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
