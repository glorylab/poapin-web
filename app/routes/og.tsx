import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CardBody, CardContainer, CardItem } from "~/components/3d-card";

const imageUrls = [
    "https://og.poap.in/api/poap/v/poap.eth",
    "https://og.poap.in/api/poap/v/glorylab.eth",
    "https://og.poap.in/api/poap/v/isabel.eth",
    "https://og.poap.in/api/poap/v/vitalik.eth",
];


export default function OGPage() {

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
            );
        }, 2000);

        return () => clearInterval(timer);
    }, []);
    return (
        <div>
            <CardContainer className="inter-var">
                <CardBody className="bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  ">
                    <CardItem
                        translateZ="50"
                        className="text-xl font-bold text-neutral-600 dark:text-white"
                    >
                        Your latest POAP collection, <br />
                        anytime, anywhere.
                    </CardItem>
                    <CardItem
                        as="p"
                        translateZ="60"
                        className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                    >
                        Show off your POAP collection!
                    </CardItem>
                    <CardItem translateZ="100" className="w-full mt-4 h-60 relative">
                        <AnimatePresence>
                            {imageUrls.map((url, index) => (
                                <motion.img
                                    key={url}
                                    src={url}
                                    className="absolute inset-0 h-full w-full object-cover rounded-xl group-hover/card:shadow-xl"
                                    alt={`thumbnail ${index + 1}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                />
                            ))}
                        </AnimatePresence>
                    </CardItem>
                    <div className="flex justify-between items-center mt-20">
                        <CardItem
                            translateZ={20}
                            target="__blank"
                            className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
                        >
                            Learn more
                        </CardItem>
                        <CardItem
                            translateZ={20}
                            as="button"
                            className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                        >
                            Early trial
                        </CardItem>
                    </div>
                </CardBody>
            </CardContainer>
        </div>
    );
}