import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { useNavigate } from "@remix-run/react";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";

interface AddressDisplayProps {
    onBack?: () => void;
}

export function AddressDisplay({ onBack }: AddressDisplayProps) {
    const [walletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();

    const handleBack = () => {
        setShowResults(false);
        if (onBack) {
            onBack();
        } else {
            navigate("/card");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-6"
        >
            <div className="flex items-center space-x-3">
                <Button
                    isIconOnly
                    variant="light"
                    className="text-gray-500"
                    onPress={handleBack}
                    aria-label="Back"
                >
                    <Icon icon="heroicons:arrow-left" width="20" height="20" />
                </Button>
                <p className="text-gray-700 font-mono">{walletAddress}</p>
            </div>
        </motion.div>
    );
}
