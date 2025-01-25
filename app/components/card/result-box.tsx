import { Card } from "@heroui/react";
import { motion } from "framer-motion";
import { PreviewImageCard } from "./preview-image-card";

interface ResultBoxProps {
    walletAddress: string;
}

export function ResultBox({ walletAddress }: ResultBoxProps) {
    const imageUrl = `https://og.poap.in/api/poap/v/${walletAddress}`;
    const imageUrl2 = `https://og.poap.in/api/poap/v/${walletAddress}/letter`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4"
        >
            <PreviewImageCard
                title="Default"
                description="Visualize your POAP collection in a beautiful way"
                imageUrl={imageUrl}
                altText={`POAP | ${walletAddress}`}
            />

            <PreviewImageCard
                title="Letter"
                description="Draw POAP on elegant letter paper"
                imageUrl={imageUrl2}
                altText={`POAP | ${walletAddress}`}
            />

            <Card 
                className="relative overflow-hidden bg-white"
                radius="lg"
                shadow="sm"
            >
                <div className="p-4 border-b border-gray-100">
                    <p className="text-gray-900 font-medium">More</p>
                    <p className="text-gray-500 text-sm mt-1">More visualization styles coming soon</p>
                </div>
                <div className="w-full aspect-[1200/630] bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-400 text-lg font-medium">Coming Soon</p>
                        <p className="text-gray-400 text-sm mt-2">More visualization styles will be available here</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
