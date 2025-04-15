import { Card } from "@heroui/react";
import { motion } from "framer-motion";
import { PreviewImageCard } from "./preview-image-card";
import { PreviewBadgeCard } from "./preview-badge-card";

interface ResultBoxProps {
    walletAddress: string;
}

export function ResultBox({ walletAddress }: ResultBoxProps) {
    const imageUrl = `https://og.poap.in/api/poap/v/${walletAddress}`;
    const imageUrl2 = `https://og.poap.in/api/poap/v/${walletAddress}/letter`;
    const imageUrl3 = `https://og.poap.in/api/poap/v/${walletAddress}/gallery`;
    const badgeUrlSm = `/badge/${walletAddress}/sm`;
    const badgeUrlMd = `/badge/${walletAddress}/md`;
    const badgeUrlLg = `/badge/${walletAddress}/lg`;

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
                address={walletAddress}
                imageUrl={imageUrl}
                ogEnabled
                altText={`POAP | ${walletAddress}`}
            />

            <PreviewImageCard
                title="Letter"
                description="Draw POAP on elegant letter paper"
                address={walletAddress}
                imageUrl={imageUrl2}
                altText={`POAP | ${walletAddress}`}
            />

            <PreviewImageCard
                title="Gallery"
                description="Visualize your POAP collection in a gallery"
                address={walletAddress}
                imageUrl={imageUrl3}
                altText={`POAP Gallery | ${walletAddress}`}
            />

            <PreviewBadgeCard
                title="Badge"
                description="Visualize your POAP collection as a badge"
                address={walletAddress}
                badgeUrlSm={badgeUrlSm}
                badgeUrlMd={badgeUrlMd}
                badgeUrlLg={badgeUrlLg}
                ogEnabled
                altText={`POAP Badge | ${walletAddress}`}
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
