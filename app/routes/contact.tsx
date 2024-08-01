import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@remix-run/react";
import { MagicCard } from "~/components/shared/magic-card";

export default function ContactPage() {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <div
                className={
                    "flex max-w-xl w-full flex-col gap-4 h-48 lg:h-56 lg:flex-row justify-center items-center mx-auto"
                }
            >


                <MagicCard
                    className="transition-all group cursor-pointer flex-col items-center justify-center hover:shadow-2xl active:shadow-md whitespace-nowrap text-4xl"
                    gradientColor={"#9C00FF55"}
                    bgColor="bg-[#8465cb]"
                    textColor="text-[#f0f0f0]"
                    border="border-[#9C00FF] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
                >
                    <Link
                        className="w-full h-full flex flex-col items-center justify-center"
                        to="https://warpcast.com/glorylab.eth" target="_blank" rel="noreferrer">
                        <div className="flex flex-row justify-center items-center gap-4 group-hover:translate-x-1 lg:group-hover:translate-y-1 transition-all">
                            <Icon
                                icon="simple-icons:farcaster"
                                width="2rem"
                                height="2rem"
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-200"
                            />
                            <span
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-400"
                            >Farcaster
                            </span>
                        </div>
                    </Link>
                </MagicCard>

                <MagicCard
                    className="transition-all group cursor-pointer flex-col items-center justify-center hover:shadow-2xl active:shadow-md whitespace-nowrap text-4xl"
                    gradientColor={"#00000055"}
                    bgColor="bg-[#101419]"
                    textColor="text-[#f0f0f0]"
                    border="border-[#000000] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
                >
                    <Link
                        className="w-full h-full flex flex-col items-center justify-center"
                        to="https://twitter.com/glorylaboratory" target="_blank" rel="noreferrer">
                        <div className="flex flex-row justify-center items-center gap-4 group-hover:translate-x-1 lg:group-hover:translate-y-1 transition-all">
                            <Icon
                                icon="simple-icons:x"
                                width="2rem"
                                height="2rem"
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-200"
                            />
                            <span
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-400"
                            >Twitter
                            </span>
                        </div>
                    </Link>
                </MagicCard>
            </div>
        </div>
    );
}