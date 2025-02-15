import { Button } from "@heroui/react";
import { motion, cubicBezier } from "framer-motion";
import { useEffect, useState } from "react";
import { CardBody, CardContainer, CardItem } from "~/components/3d-card";

const imageUrls = [
    "https://og.poap.in/api/poap/v/poap.eth/letter",
    "https://og.poap.in/api/poap/v/glorylab.eth",
    "https://og.poap.in/api/poap/v/isabel.eth/letter",
    "https://og.poap.in/api/poap/v/vitalik.eth",
];

// Physical easing curve
const physicsEasing = cubicBezier(0.34, 1.56, 0.64, 1);

interface PreviewCardProps {
    onGetStarted: () => void;
}

export function PreviewCard({ onGetStarted }: PreviewCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
        }, 3000);

        return () => clearInterval(interval);
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
                    Generate a beautiful <span className="rounded-md bg-secondary-100 text-secondary-600 border border-[1px] border-secondary-300 shadow-md shadow-secondary-300 p-1">card</span> to showcase your POAP collection.
                </CardItem>
                <CardItem translateZ="100" className="w-full mt-4">
                    <div className="relative w-full aspect-[1200/630] rounded-lg sm:rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-black/5" />

                        {/* Preload all images */}
                        <div className="hidden">
                            {imageUrls.map((url) => (
                                <img key={url} src={url} alt="preload" />
                            ))}
                        </div>

                        {/* Stack all images */}
                        {imageUrls.map((url, index) => (
                            <motion.div
                                key={url}
                                className="absolute bg-white border border-[1px] border-yellow-200 inset-0 w-full h-full object-cover rounded-lg sm:rounded-xl shadow-md group-hover/card:shadow-xl group-hover/card:rounded-sm transition-all"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: index === currentImageIndex ? 1 : 0,
                                    zIndex: index === currentImageIndex ? imageUrls.length - index : 0
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: physicsEasing,
                                    opacity: {
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 20
                                    }
                                }}
                            >
                                <img
                                    src={url}
                                    className="absolute bg-white border border-yellow-200 inset-0 w-full h-full object-cover rounded-lg sm:rounded-xl shadow-md group-hover/card:shadow-xl group-hover/card:rounded-sm transition-all"
                                    alt={`thumbnail ${index + 1}`}
                                    loading="eager"
                                    style={{
                                        willChange: "transform",
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden"
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </CardItem>
                <div className="flex justify-center items-center mt-16">
                    <CardItem translateZ={20}>
                        <Button
                            variant="shadow"
                            size="lg"
                            className="text-background-600 p-8 shadow-xl active:translate-y-1 hover:shadow-gray-100 active:shadow-gray-50 shadow-gray-200 hover:bg-background-100 active:bg-background-200 text-xl tracking-wider font-bold transition-all"
                            onPress={onGetStarted}
                        >
                            Get started
                        </Button>
                    </CardItem>
                </div>
            </CardBody>
        </CardContainer>
    );
}
