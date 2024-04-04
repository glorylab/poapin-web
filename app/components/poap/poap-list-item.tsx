import React, { useEffect, useRef } from "react";
import { Link, Skeleton } from "@nextui-org/react";

import { cn } from "~/src/cn";
import { POAP } from "~/types/poap";

export type PoapListItemColor = {
  name: string;
  hex: string;
};

export type PoapListItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
  poap: POAP;
  isPopular?: boolean;
  isLoading?: boolean;
  removeWrapper?: boolean;
} ;

const PoapListItem = React.forwardRef<HTMLDivElement, PoapListItemProps>(
  (
    { poap, isLoading, removeWrapper, className, ...props },
    ref,
  ) => {

    const imageRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const lazyImage = entry.target as HTMLImageElement;
              lazyImage.src = lazyImage.dataset.src || "";
              observer.unobserve(lazyImage);
            }
          });
        },
        {
          rootMargin: "0px",
          threshold: 0.1,
        }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => {
        if (imageRef.current) {
          observer.unobserve(imageRef.current);
        }
      };
    }, []);

    return (
      <Link
        href={`/poap/${poap.tokenId}`}
        className="w-full active:ring-0"
        target="_self"
        style={{ textDecoration: "none" }}
      >
        <div
          ref={ref}
          className={cn(
            "group relative flex w-full active:bg-background-700 active:p-3 hover:cursor-pointer hover:bg-background-600 p-2 rounded-md overflow-visible flex-col transition-all duration-300 ease-in-out hover:scale-95",
            {
              "rounded-none bg-background shadow-none": removeWrapper,
            },
            className,
          )}
          {...props}
        >

          <img
            ref={imageRef}
            alt={poap.event.name}
            data-src={poap.event.image_url + "?size=medium"}
            className="aspect-square w-full rounded-full"
            width={300}
            height={300}
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
                    <h3 className="text-small font-bold text-default-700 overflow-hidden whitespace-nowrap mask-image-gradient-to-r">
                      {poap.event.name}
                    </h3>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  },
);

PoapListItem.displayName = "PoapListItem";

export default PoapListItem;
