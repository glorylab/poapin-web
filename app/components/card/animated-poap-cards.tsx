import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";

type PoapCard = {
    title: string;
    description: string;
    address: string;
    src: string;
};

export const AnimatedPoapCards = ({
    cards,
    autoplay = true,
    autoSwitchDuration = 5000, // 5 seconds default
    onGetStarted,
}: {
    cards: PoapCard[];
    autoplay?: boolean;
    autoSwitchDuration?: number;
    onGetStarted: () => void;
}) => {
    const [active, setActive] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Function to reset the auto-switch timer
    const resetAutoSwitchTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (autoplay) {
            intervalRef.current = setInterval(() => {
                setActive((prev) => (prev + 1) % cards.length);
            }, autoSwitchDuration);
        }
    };

    const handleNext = () => {
        setActive((prev) => (prev + 1) % cards.length);
        resetAutoSwitchTimer(); // Reset timer when user manually navigates
    };

    const handlePrev = () => {
        setActive((prev) => (prev - 1 + cards.length) % cards.length);
        resetAutoSwitchTimer(); // Reset timer when user manually navigates
    };

    const isActive = (index: number) => {
        return index === active;
    };

    // Initialize auto-switch timer
    useEffect(() => {
        resetAutoSwitchTimer();
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoplay, autoSwitchDuration, cards.length]);

    const randomRotateY = () => {
        return Math.floor(Math.random() * 21) - 10;
    };

    return (
        <div className="mx-auto max-w-sm px-4 py-2 font-sans antialiased md:max-w-6xl md:px-8 lg:px-12">
            <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-12">
                <div className="w-full">
                    <div className="relative w-full h-[400px] flex items-center justify-center">
                        <AnimatePresence>
                            {cards.map((card, index) => (
                                <motion.div
                                    key={card.src}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: -100,
                                        rotate: randomRotateY(),
                                    }}
                                    animate={{
                                        opacity: isActive(index) ? 1 : 0.7,
                                        scale: isActive(index) ? 1 : 0.95,
                                        z: isActive(index) ? 0 : -100,
                                        rotate: isActive(index) ? 0 : randomRotateY(),
                                        zIndex: isActive(index)
                                            ? 40
                                            : cards.length + 2 - index,
                                        y: isActive(index) ? [0, -20, 0] : 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: 100,
                                        rotate: randomRotateY(),
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute inset-0 flex items-center justify-center origin-bottom"
                                >
                                    <div className="relative rounded-3xl overflow-hidden bg-white border border-yellow-200 shadow-xl max-w-full max-h-full">
                                        <img
                                            src={card.src}
                                            alt={card.title}
                                            draggable={false}
                                            className="max-h-[380px] max-w-full w-auto h-auto object-contain"
                                            loading="eager"
                                            style={{
                                                willChange: "transform",
                                                backfaceVisibility: "hidden",
                                                WebkitBackfaceVisibility: "hidden"
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/5" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-8 py-4">
                    <motion.div
                        key={active}
                        initial={{
                            y: 20,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: -20,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                        }}
                    >
                        <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                            {cards[active].title}
                        </h3>
                        <div className="mb-4">
                            <Chip
                                key={cards[active].address}
                                classNames={{
                                    base: "bg-gradient-to-br from-secondary-300 to-secondary-500 border-small border-secondary-400 shadow-primary-500/20 overflow-clip",
                                    content: "drop-shadow-sm shadow-black text-white font-medium",
                                }}
                                variant="shadow"
                                size="sm"
                            >
                                {cards[active].address}
                            </Chip>
                        </div>
                        <motion.p className="text-lg text-primary leading-relaxed">
                            {cards[active].description.split(" ").map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{
                                        filter: "blur(10px)",
                                        opacity: 0,
                                        y: 5,
                                    }}
                                    animate={{
                                        filter: "blur(0px)",
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        ease: "easeInOut",
                                        delay: 0.02 * index,
                                    }}
                                    className="inline-block"
                                >
                                    {word}&nbsp;
                                </motion.span>
                            ))}
                        </motion.p>
                    </motion.div>

                    <div className="flex flex-col items-center gap-6 pt-8 md:pt-0">
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handlePrev}
                                className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200"
                            >
                                <Icon icon="mingcute:left-fill" className="w-5 h-5 text-neutral-600 transition-transform duration-300 group-hover/button:rotate-12" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200"
                            >
                                <Icon icon="mingcute:right-fill" className="w-5 h-5 text-neutral-600 transition-transform duration-300 group-hover/button:-rotate-12" />
                            </button>
                        </div>

                        <Button
                            variant="shadow"
                            size="lg"
                            className="text-background-600 p-6 shadow-xl active:translate-y-1 hover:shadow-gray-100 active:shadow-gray-50 shadow-gray-200 hover:bg-background-100 active:bg-background-200 text-xl tracking-wider font-bold transition-all max-w-[315px]"
                            onPress={onGetStarted}
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
