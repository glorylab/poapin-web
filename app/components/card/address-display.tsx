import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { useNavigate, Link } from "@remix-run/react";
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
                <Link 
                    to={`/v/${walletAddress}`} 
                    className="text-background-700 font-mono px-2 py-1 bg-secondary-50 rounded-md border border-secondary-500 hover:bg-secondary-50/30 active:bg-secondary-50/90 active:text-background-900 active:shadow-sm hover:shadow-md hover:text-background-800 transition-all flex items-center"
                    title={`View ${walletAddress}'s POAP Collection`}
                    aria-label={`View ${walletAddress}'s complete POAP collection`}
                    rel="canonical"
                >
                    <span>{walletAddress}</span>
                    <span className="ml-2 text-xs text-background-500 hidden sm:inline">(View full collection)</span>
                </Link>
            </div>
        </motion.div>
    );
}
