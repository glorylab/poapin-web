import { POAP } from "~/types/poap";
import { cn } from "~/src/cn";
import PoapListItem from "~/components/poap/poap-list-item";
import { getMomentsCountOfDrop } from "~/utils/poap-utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/react";

interface PoapGridProps {
    poaps: POAP[];
    dropsWithMoments: number[];
    className?: string;
}

const ITEMS_PER_PAGE = 60; // Show 60 POAPs initially, then load more
const LOAD_MORE_THRESHOLD = 200; // Load more when user is 200px from bottom

export function PoapGrid({ poaps, dropsWithMoments, className }: PoapGridProps) {
    const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    // Get currently displayed POAPs
    const displayedPoaps = poaps.slice(0, displayedCount);
    const hasMore = displayedCount < poaps.length;

    // Load more POAPs
    const loadMore = useCallback(() => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, poaps.length));
            setIsLoading(false);
        }, 300);
    }, [isLoading, hasMore, poaps.length]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!loadingRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading) {
                    loadMore();
                }
            },
            {
                rootMargin: `${LOAD_MORE_THRESHOLD}px`,
            }
        );

        observer.observe(loadingRef.current);
        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoading]);

    return (
        <div className="block rounded-medium border-background-200 border-dashed border-[1px]" ref={containerRef}>
            <div className="flex flex-col items-center">
                <section 
                    aria-label="POAP Collection"
                    className={cn(
                        "my-auto grid max-w-7xl gap-5 p-4 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                        className
                    )}
                >
                    {displayedPoaps.map((poap) => (
                        <article 
                            key={poap.tokenId} 
                            aria-label={poap.event.name}
                            className="poap-item"
                        >
                            <PoapListItem 
                                poap={poap} 
                                momentsCount={getMomentsCountOfDrop(poap, dropsWithMoments)} 
                            />
                        </article>
                    ))}
                </section>
                
                {/* Loading indicator and load more button */}
                {hasMore && (
                    <div className="flex flex-col items-center gap-4 p-4" ref={loadingRef}>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-default-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <span>Loading more POAPs...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    onPress={loadMore}
                                    className="text-default-600 hover:text-primary"
                                >
                                    Load More POAPs ({poaps.length - displayedCount} remaining)
                                </Button>
                                <p className="text-xs text-default-400">
                                    Showing {displayedCount} of {poaps.length} POAPs
                                </p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Show completion message when all loaded */}
                {!hasMore && poaps.length > ITEMS_PER_PAGE && (
                    <div className="p-4 text-center text-default-500">
                        <p>All {poaps.length} POAPs loaded! 🎉</p>
                    </div>
                )}
            </div>
        </div>
    );
}
