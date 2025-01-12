import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@nextui-org/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface ResultBoxProps {
    walletAddress: string;
    onCopy: () => void;
    copySuccess: boolean;
}

export function ResultBox({ walletAddress, onCopy, copySuccess }: ResultBoxProps) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 bg-white p-4 rounded-lg shadow flex items-center justify-between"
            >
                <p className="text-lg truncate text-green-700 flex-grow mr-2 font-mono">
                    https://og.poap.in/api/poap/v/{walletAddress}
                </p>
                <Button
                    isIconOnly
                    className="text-gray-500"
                    aria-label="Copy"
                    onClick={onCopy}
                >
                    <Icon icon="akar-icons:copy" width="20" height="20" />
                </Button>
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
