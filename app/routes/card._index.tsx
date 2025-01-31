import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useAtom } from "jotai";
import { useNavigate } from "@remix-run/react";
import { PreviewCard } from "~/components/card/preview-card";
import { AddressForm } from "~/components/card/address-form";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";

export default function CardIndexPage() {
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);
    const [, setWalletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();

    const handleGetStarted = () => {
        setIsCardVisible(false);
        setTimeout(() => setIsPlaceholderVisible(true), 500);
    };

    const handleAddressSubmit = (address: string) => {
        setWalletAddress(address);
        setShowResults(true);
        navigate(`/card/${address}`);
    };

    return (
        <div className="w-full mx-auto px-2 md:px-4 lg:px-8">
            <AnimatePresence>
                {isCardVisible && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="w-full max-w-2xl mx-auto px-4 pt-4 pb-8"
                    >
                        <PreviewCard onGetStarted={handleGetStarted} />
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="max-w-2xl w-full mx-auto border-x-1 md:border-x-2 lg:border-x-4 border-yellow-400 border-solid shadow-2xl">
                <AnimatePresence>
                    {isPlaceholderVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                            className="w-full mx-auto"
                        >
                            <div className="bg-neutral-50 p-8">
                                <h2 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h2>
                                <AnimatePresence mode="wait">

                                    <AddressForm onSubmit={handleAddressSubmit} />

                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
