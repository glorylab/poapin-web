import React from "react";
import { Button, Image, Skeleton } from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { cn } from "~/src/cn";
import { POAP } from "~/types/poap";

export type PoapListItemColor = {
  name: string;
  hex: string;
};

export type PoapListItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
  isPopular?: boolean;
  isLoading?: boolean;
  removeWrapper?: boolean;
} & POAP;

const PoapListItem = React.forwardRef<HTMLDivElement, PoapListItemProps>(
  (
    { event, isLoading, removeWrapper, className, ...props },
    ref,
  ) => {

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col",
          {
            "rounded-none bg-background shadow-none": removeWrapper,
          },
          className,
        )}
        {...props}
      >
        <Image
          isBlurred
          alt={event.name}
          className="aspect-square w-full hover:scale-110 rounded-full"
          isLoading={isLoading}
          src={event.image_url}
        />

        <div className="mt-1 mb-4 flex flex-col flex-grow gap-2 px-1">
          {isLoading ? (
            <div className="my-1 flex flex-col gap-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="h-3 w-3/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="mt-3 w-4/5 rounded-lg">
                <div className="h-3 w-4/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="mt-4 w-2/5 rounded-lg">
                <div className="h-3 w-2/5 rounded-lg bg-default-300" />
              </Skeleton>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-1">
                <div className="relative flex flex-grow max-h-12 overflow-hidden rounded-lg px-2 pt-6">
                  <h3 className="text-small font-bold text-default-700 overflow-hidden whitespace-nowrap">{event.name}</h3>
                </div>
              </div>
              {event.description ? (
                <div className="relative flex-grow max-h-24 bg-neutral-100 overflow-hidden rounded-lg p-2">
                  <p className="text-small text-default-500">{event.description}</p>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neutral-100 to-transparent" />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  },
);

PoapListItem.displayName = "PoapListItem";

export default PoapListItem;
