import { Collection } from "~/api/poap-graph";
import { MagicCard } from "../shared/magic-card";
import { Link } from "@remix-run/react";
import { Image } from "@heroui/react";

export const CollectionCard = ({ collection }: { collection: Collection }) => {
    const collectionAllCount = collection.collections_items_aggregate.aggregate.count;
    const collectedCount = collection.collections_items.length;
    return (
        <div className="relative h-40 w-64">
            <MagicCard
                className="h-full w-full p-0 transition-all group cursor-pointer flex flex-col justify-between overflow-hidden text-start hover:scale-95 active:scale-90"
                gradientColor={"#00FF9C22"}
                border="border-[#00FF9C] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
            >
                <Link
                    to={`https://collections.poap.xyz/${collection.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="h-full w-full flex flex-col justify-between items-center"
                >
                    <div className="h-20 w-full overflow-hidden">
                        {collection.banner_image_url ? (
                            <Image
                                src={collection.banner_image_url}
                                alt={collection.title}
                                className="h-20 w-full object-cover rounded-none"
                            />
                        ) : (
                            <div className="h-20 w-full bg-background-200 flex justify-center items-center rounded-md">
                                <Image
                                    src={collection.logo_image_url}
                                    alt={collection.title}
                                    className="h-16 w-auto object-cover"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow flex items-center justify-center px-2">
                        <div className="text-lg font-medium text-center line-clamp-2 text-neutral-700">
                            {collection.title}
                        </div>
                    </div>
                    <div className="w-full pb-0 px-0">
                        <div className="relative w-full h-4 border-t-1 border-neutral-300/80">
                            <div className="absolute inset-0 flex">
                                {Array.from({ length: collectionAllCount }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`h-full flex-1 ${
                                            i < collectedCount ? 'bg-success-500' : 'bg-neutral-200'
                                        }`}
                                    ></div>
                                ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-end">
                                <span className="text-xs font-mono font-bold text-success-700/50 drop-shadow-md mr-2">
                                    {collectionAllCount === collectedCount
                                        ? "All collected!"
                                        : `${collectedCount} / ${collectionAllCount}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </MagicCard>
        </div>
    );
};