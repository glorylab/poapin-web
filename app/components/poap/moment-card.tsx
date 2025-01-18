import { Moment } from "~/types/poap";
import { Image } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { MagicCard } from "../shared/magic-card";
import { Link } from "@remix-run/react";

export const MomentCard = ({ moment }: { moment: Moment }) => {
    const formatDescription = (description: string) => {
        const twitterRegex = /https?:\/\/(www\.)?(x\.com|twitter\.com)\/([a-zA-Z0-9_]+)(\/status\/\d+)?/;
        const match = description.match(twitterRegex);

        if (match) {
            const username = match[3];
            return (
                <div className="flex items-center space-x-2">
                    <Icon
                        icon="simple-icons:x"
                        width="1.5rem"
                        height="1.5rem"
                        className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-200"
                    />
                    <span className="font-mono text-sm">@{username}</span>
                </div>
            );
        }

        return description;
    };

    return (
        <div className="relative h-40 w-auto flex flex-col">
            <div className="flex-grow relative overflow-hidden rounded-t-medium transition-all group cursor-pointer hover:scale-95 active:scale-90">
                {moment.media && moment.media.length > 0 && (
                    <div className="h-full flex justify-center items-center">
                        <Image
                            src={moment.media[0].gateways[0].url}
                            alt={moment.description ?? ""}
                            className="h-40 w-auto max-w-none object-scale-down"
                        />
                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                            <Image
                                src={moment.drop.image_url}
                                alt={`POAP for drop ${moment.drop_id}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

            </div>
            {moment.description && (
                <div className="h-full flex justify-center items-center ">
                    <MagicCard
                        className="h-40 w-full px-3 py-2 transition-all group cursor-pointer flex items-center justify-start overflow-hidden text-start hover:scale-95 active:scale-90"
                        gradientColor={"#9C00FF22"}
                        border="border-[#9C00FF] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
                    >
                        <Link to={moment.description.includes("http") ? `${moment.description}` : ""} className="text-sm font-medium truncate h-full w-full flex flex-col justify-center items-center">
                            <div className="text-sm truncate">
                                {formatDescription(moment.description)}
                            </div>
                            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                                <Image
                                    src={moment.drop.image_url}
                                    alt={`POAP for drop ${moment.drop_id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </Link>
                    </MagicCard>

                </div>
            )}
        </div>
    );
};