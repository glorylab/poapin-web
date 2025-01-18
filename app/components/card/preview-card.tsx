import { Button, Card } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CardBody, CardContainer, CardItem } from "~/components/3d-card";

const imageUrls = [
    "https://og.poap.in/api/poap/v/poap.eth",
    "https://og.poap.in/api/poap/v/glorylab.eth",
    "https://og.poap.in/api/poap/v/isabel.eth",
    "https://og.poap.in/api/poap/v/vitalik.eth",
];

interface PreviewCardProps {
    onGetStarted: () => void;
}

export function PreviewCard({ onGetStarted }: PreviewCardProps) {
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
        <CardContainer className="inter-var w-full">
            <CardBody className="bg-gray-50 relative group/card shadow-2xl border-black/[0.4] w-full h-auto rounded-xl p-4 sm:p-6 border flex flex-col">
                <CardItem
                    translateZ="50"
                    className="text-lg p-4 sm:text-xl font-bold text-neutral-600 dark:text-white"
                >
                    <h1 className="text-2xl sm:text-3xl md:text-4xl transition-all">Your latest POAP collection</h1>
                    <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl xl:text-3xl transition-all mt-1 lg:mt-2">Anytime, Anywhere.</h2>
                </CardItem>
                <CardItem
                    as="p"
                    translateZ="60"
                    className="text-sm text-neutral-500 px-4 mt-2 dark:text-neutral-300"
                >
                    Show off your POAP collection!
                </CardItem>
                <CardItem
                    translateZ="100"
                    className="w-full mt-4 relative"
                    style={{
                        aspectRatio: "1200 / 630"
                    }}
                >
                    <AnimatePresence>
                        {imageUrls.map((url, index) => (
                            <motion.img
                                key={url}
                                src={url}
                                className="absolute bg-white border border-yellow-200 inset-0 w-full h-full object-cover rounded-lg sm:rounded-xl shadow-md group-hover/card:shadow-xl group-hover/card:rounded-sm transition-all"
                                alt={`thumbnail ${index + 1}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            />
                        ))}
                    </AnimatePresence>
                </CardItem>
                <div className="flex justify-center items-center mt-16">
                    <CardItem translateZ={20}>
                        <Button
                            variant="shadow"
                            size="lg"
                            className="text-background-600 p-8 shadow-xl active:translate-y-1 hover:shadow-gray-100 active:shadow-gray-50 shadow-gray-200 hover:bg-background-100 active:bg-background-200 text-xl tracking-wider font-bold transition-all"
                            onClick={onGetStarted}
                        >
                            Get started
                        </Button>
                    </CardItem>
                </div>
            </CardBody>
        </CardContainer>
    );
}
