import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "@heroui/react";

import { cn } from "~/src/cn";
import { POAP } from "~/types/poap";
import { useNavigate, useNavigation } from "@remix-run/react";

export type PoapListItemColor = {
  name: string;
  hex: string;
};

export type PoapListItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
  poap: POAP;
  momentsCount?: number;
  isPopular?: boolean;
  isLoading?: boolean;
};

const PoapListItem = React.forwardRef<HTMLDivElement, PoapListItemProps>(
  (
    { poap, momentsCount, isLoading, className, ...props },
    ref,
  ) => {

    const imageRef = useRef(null);
    const transition = useNavigation();
    const isNavigating = transition.state === "loading";
    const [navigatingUrl, setNavigatingUrl] = useState("");

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

    const navigate = useNavigate();
    return (

      <button
        className="w-full active:ring-0"
        style={{ textDecoration: "none" }}
        onClick={() => {
          if (isNavigating) return;
          setNavigatingUrl(`/poap/${poap.tokenId}`);
          navigate(`/poap/${poap.tokenId}`);
        }}
      >
        <div
          ref={ref}
          className={cn(
            "group relative flex w-full active:bg-background-700 active:p-3 hover:cursor-pointer hover:bg-background-600 p-2 rounded-md overflow-visible flex-col transition-all duration-300 ease-in-out hover:scale-95",
            { "bg-background-900 p-4 ": isNavigating && navigatingUrl === `/poap/${poap.tokenId}` },
            { "bg-transparent": !momentsCount || momentsCount === 0 },
            { "bg-background-300": momentsCount && momentsCount > 0 },
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
                      {isNavigating && navigatingUrl === `/poap/${poap.tokenId}` ? `Loading...` : poap.event.name}
                    </h3>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </button>
    );
  },
);

PoapListItem.displayName = "PoapListItem";

export default PoapListItem;
