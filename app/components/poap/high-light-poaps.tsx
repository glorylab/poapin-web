import { Link, useNavigate, useNavigation } from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "~/src/cn";
import { Spinner } from "@nextui-org/react";

interface AddressInfo {
    eth: string;
    ens?: string;
}

export interface HighLightPoapsProps {
    backgroundImage?: string;
    backgroundColor?: string;
    address: AddressInfo;
}

export const HighLightPoaps: React.FC<{ data: HighLightPoapsProps[] }> = ({ data }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isNavigating = navigation.state !== "idle";

    const cardVariants = {
        whileHover: {
            scale: 1.05,
            rotate: 0,
            zIndex: 100,
        },
        whileTap: {
            scale: 1.08,
            rotate: 0,
            zIndex: 100,
        },
        exit: (custom: number) => ({
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.2, delay: custom * 0.05 }
        }),
        initial: (custom: number) => ({
            rotate: custom,
            opacity: 1,
            scale: 1,
        }),
        selected: {
            scale: 1.1,
            zIndex: 100,
            transition: { duration: 0.2 }
        }
    };

    const randomRotations = useMemo(() =>
        data.map(() => Math.random() * 20 - 10),
        [data]
    );

    const handleCardClick = (index: number, address: string) => {
        if (selectedIndex !== null || isNavigating) return;
        setSelectedIndex(index);
        setTimeout(() => {
            navigate(`/v/${address}`);
        }, 800);
    };

    return (
        <div className="relative flex flex-col items-center p-8 gap-10 h-full">
            <div className="mask-container px-[10px] pt-2 pb-40">
                <div className="flex flex-row flex-wrap justify-center -ml-4 overflow-visible">
                    <AnimatePresence>
                        {data.map((item, itemIdx) => (
                            <motion.div
                                key={`${itemIdx}`}
                                variants={cardVariants}
                                whileHover={selectedIndex === null ? "whileHover" : undefined}
                                whileTap={selectedIndex === null ? "whileTap" : undefined}
                                initial="initial"
                                animate={selectedIndex === itemIdx ? "selected" : "initial"}
                                exit="exit"
                                custom={randomRotations[itemIdx]}
                                className={cn(
                                    "rounded-xl -mr-4 mt-4 border border-neutral-100 flex-shrink-0 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]",
                                    "cursor-pointer",
                                    (selectedIndex !== null && selectedIndex !== itemIdx) && "pointer-events-none"
                                )}
                                style={{
                                    maxWidth: 'calc(20rem * 1.618)',
                                    minWidth: '200px',
                                    backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : undefined,
                                    backgroundColor: item.backgroundColor || undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                onClick={() => handleCardClick(itemIdx, item.address.ens || item.address.eth)}
                            >
                                <div className="h-full w-full flex items-center justify-center relative">
                                    <div className="text-xl font-medium truncate font-mono px-4 py-8">
                                        {item.address.ens || item.address.eth}
                                    </div>
                                    {isNavigating && selectedIndex === itemIdx && (
                                        <div className="absolute bottom-1 right-1">
                                            <Spinner size="sm" color="secondary" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            <style>{`
                .mask-container {
                    mask-image: linear-gradient(
                        to right,
                        transparent 0px,
                        black 100px,
                        black calc(100% - 100px),
                        transparent 100%
                    );
                    -webkit-mask-image: linear-gradient(
                        to right,
                        transparent 0px,
                        black 100px,
                        black calc(100% - 100px),
                        transparent 100%
                    );
                }
            `}</style>
        </div>
    );
};