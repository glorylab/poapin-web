import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PreviewCard } from "~/components/card/preview-card";
import { AddressForm } from "~/components/card/address-form";
import { ResultBox } from "~/components/card/result-box";

export default function OGPage() {
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);
    const [showAddressBox, setShowAddressBox] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [copySuccess, setCopySuccess] = useState(false);

    const handleGetStarted = () => {
        setIsCardVisible(false);
        setTimeout(() => setIsPlaceholderVisible(true), 500);
    };

    const handleAddressSubmit = (address: string) => {
        setWalletAddress(address);
        setShowAddressBox(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://og.poap.in/api/poap/v/${walletAddress}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <AnimatePresence>
                {isCardVisible && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                    >
                        <PreviewCard onGetStarted={handleGetStarted} />
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isPlaceholderVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="w-full max-w-4xl mx-auto px-4 py-8"
                    >
                        <div className="bg-gray-100 rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h2>
                            <AddressForm onSubmit={handleAddressSubmit} />
                            <AnimatePresence>
                                {showAddressBox && (
                                    <ResultBox
                                        walletAddress={walletAddress}
                                        onCopy={handleCopy}
                                        copySuccess={copySuccess}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}