import { Icon } from "@iconify/react/dist/iconify.js";
import { Button, Card, Image } from "@nextui-org/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface ResultBoxProps {
    walletAddress: string;
    onCopy: () => void;
    copySuccess: boolean;
}

export function ResultBox({ walletAddress, onCopy, copySuccess }: ResultBoxProps) {
    const imageUrl = `https://og.poap.in/api/poap/v/${walletAddress}`;
    const imageUrl2 = `https://og.poap.in/api/poap/v/${walletAddress}/letter`;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-4"
            >
                <Card className="bg-white p-4 shadow flex items-center justify-between">
                    <p className="text-lg truncate text-green-700 flex-grow mr-2 font-mono">
                        {imageUrl}
                    </p>
                    <Button
                        isIconOnly
                        className="text-gray-500"
                        aria-label="Copy"
                        onClick={onCopy}
                    >
                        <Icon icon="akar-icons:copy" width="20" height="20" />
                    </Button>
                </Card>

                <Card 
                    className="relative overflow-hidden bg-gray-50"
                    radius="lg"
                    shadow="md"
                >
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                    <Image
                        src={imageUrl}
                        radius="none"
                        alt="POAP Collection Preview"
                        classNames={{
                            wrapper: "w-full aspect-[1200/630]",
                            img: "object-cover w-full h-full"
                        }}
                    />
                    <Image
                        src={imageUrl2}
                        radius="none"
                        alt="POAP Collection Preview"
                        classNames={{
                            wrapper: "w-full aspect-[1200/630]",
                            img: "object-cover w-full h-full"
                        }}
                    />
                </Card>
            </motion.div>
            
            <AnimatePresence>
                {copySuccess && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="text-green-600 text-center mt-2"
                    >
                        Copied successfully!
                    </motion.p>
                )}
            </AnimatePresence>
        </>
    );
}
