import { Icon } from "@iconify/react/dist/iconify.js";
import { Button, Input } from "@nextui-org/react";
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
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [isValidAddress, setIsValidAddress] = useState(true);
    const [showAddressBox, setShowAddressBox] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
            );
        }, 2000);

        return () => clearInterval(timer);
    }, []);

    const handleGetStarted = () => {
        setIsCardVisible(false);
        setTimeout(() => setIsPlaceholderVisible(true), 500);
    };

    const isValidEthAddress = (address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const isValidEns = (address: string) => {
        return /^[a-zA-Z0-9-]+\.eth$/.test(address);
    };

    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const address = e.target.value;
        setWalletAddress(address);
        setIsValidAddress(isValidEthAddress(address) || isValidEns(address));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValidAddress) {
            setShowAddressBox(true);
        }
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
                        <CardContainer className="inter-var w-full">
                            <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl border-black/[0.1] w-full h-auto rounded-xl p-4 sm:p-6 border flex flex-col">
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
                                                className="absolute inset-0 w-full h-full object-cover rounded-lg sm:rounded-xl group-hover/card:shadow-xl"
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
                                            onClick={handleGetStarted}
                                        >
                                            Get started
                                        </Button>
                                    </CardItem>
                                </div>
                            </CardBody>
                        </CardContainer>
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
                            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-center">
                                <Input
                                    type="text"
                                    label="Where you store your POAPs"
                                    placeholder="ETH address or ENS"
                                    value={walletAddress}
                                    labelPlacement="outside"
                                    onChange={handleWalletAddressChange}
                                    classNames={{
                                        input: "text-lg !text-gray-800",
                                        label: "!text-gray-800",
                                        inputWrapper: "text-gray-800",
                                    }}
                                    errorMessage={!isValidAddress && "Please enter a valid ETH address or ENS"}
                                />
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={!isValidAddress || !walletAddress}
                                    className="bg-green-500 tracking-wider text-white  px-8 text-2xl py-4 font-bold w-auto mx-auto"
                                >
                                    Go
                                </Button>
                            </form>
                            <AnimatePresence>
                                {showAddressBox && (
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
                                            onClick={handleCopy}
                                        >
                                            <Icon icon="akar-icons:copy" width="20" height="20" />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}