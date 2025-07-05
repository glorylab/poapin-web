import { Collection } from "~/lib/poap-graph";
import Marquee from "~/components/shared/marquee";
import { CollectionCard } from "~/components/poap/collection-card";

interface CollectionsSectionProps {
    collections: Collection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
    if (!collections || collections.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 p-4 bg-default-50 bg-opacity-30 backdrop-blur-sm rounded-medium mx-auto mb-4">
            <h2 className="text-medium font-medium text-background-700">Collections</h2>
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg">
                <Marquee pauseOnHover>
                    {collections.map((collection) => (
                        <CollectionCard key={collection.id} collection={collection} />
                    ))}
                </Marquee>
            </div>
        </div>
    );
}
