import { POAP } from "~/types/poap";
import { cn } from "~/src/cn";
import PoapListItem from "~/components/poap/poap-list-item";
import { getMomentsCountOfDrop } from "~/utils/poap-utils";

interface PoapGridProps {
    poaps: POAP[];
    dropsWithMoments: number[];
    className?: string;
}

export function PoapGrid({ poaps, dropsWithMoments, className }: PoapGridProps) {
    return (
        <div className="block rounded-medium border-background-200 border-dashed border-[1px]">
            <div className="flex flex-col items-center">
                <section 
                    aria-label="POAP Collection"
                    className={cn(
                        "my-auto grid max-w-7xl gap-5 p-4 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                        className
                    )}
                >
                    {poaps.map((poap) => (
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
            </div>
        </div>
    );
}
